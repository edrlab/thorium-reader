// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesToasts from "readium-desktop/renderer/assets/styles/components/toasts.scss";

import { clipboard } from "electron";
import classNames from "classnames";
import * as React from "react";
import { ToastType } from "readium-desktop/common/models/toast";
import { _APP_NAME } from "readium-desktop/preprocessor-directives";
import * as QuitIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px.svg";
import SVG from "readium-desktop/renderer/common/components/SVG";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import { uuidv4 } from "readium-desktop/utils/uuid";
import { TranslatorProps, withTranslator } from "../hoc/translator";
import { connect } from "react-redux";
import { IRendererCommonRootState } from "readium-desktop/common/redux/states/rendererCommonRootState";


const capitalizedAppName = _APP_NAME.charAt(0).toUpperCase() + _APP_NAME.substring(1);

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
    close: (id: string) => void;
    className?: string;
    id?: string;
    // icon?: ISVGProps;
    message?: string;
    displaySystemNotification?: boolean;
    type?: ToastType;
}

// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps {
}

interface IState {
    willLeave: boolean;
    toRemove: boolean;
    opened: boolean;
    copyFeedback?: "copied" | "failed";
}

export class Toast extends React.Component<IProps, IState> {
    private ref: React.RefObject<HTMLDivElement>;
    private messageId = `toast-message-${uuidv4()}`;
    private fallbackTimer: number | undefined;
    private isRemoving = false;

    constructor(props: IProps) {
        super(props);

        this.ref = React.createRef<HTMLDivElement>();

        this.state = {
            willLeave: false,
            toRemove: false,
            opened: false,
        };

        this.handleTransitionEnd = this.handleTransitionEnd.bind(this);
        this.handleClose = this.handleClose.bind(this);
    }

    public componentDidMount() {
        // Visible notifications remain available until explicitly dismissed.

        // https://www.electronjs.org/docs/latest/tutorial/notifications
        if (this.props.displaySystemNotification) {
            new Notification(capitalizedAppName, {
                body: this.props.message,
            });
            this.props.close(this.props.id);
        }
    }

    public componentWillUnmount() {
        if (this.fallbackTimer) window.clearTimeout(this.fallbackTimer);
    }

    public render(): React.ReactElement<{}> {

        if (this.props.displaySystemNotification) {
            return (<></>);
        }

        const { type, __ } = this.props;
        const { willLeave, toRemove } = this.state;

        let typeClassName: string;
        switch (type) {
            case ToastType.Error:
                typeClassName = stylesToasts.error;
                break;
            case ToastType.Success:
                typeClassName = stylesToasts.success;
                break;
            default:
                break;
        }

        return (
            <div
                onTransitionEnd={this.handleTransitionEnd}
                ref={this.ref}
                className={classNames(
                    stylesToasts.toast,
                    willLeave && stylesToasts.leave,
                    toRemove && stylesToasts.toRemove,
                    typeClassName,
                )}
            >
                <p
                    id={this.messageId}
                    aria-live="assertive"
                    aria-relevant="all"
                    role="alert"
                    className={this.state.opened ? stylesToasts.toast_open : ""}
                >{this.props.message}</p>
                <div className={stylesToasts.actions}>
                    <button
                        type="button"
                        className={stylesButtons.button_secondary_blue}
                        aria-expanded={this.state.opened}
                        aria-controls={this.messageId}
                        onClick={() => this.setState(state => ({ opened: !state.opened }))}
                    >{__("accessibility.notificationDetails")}</button>
                    <button
                        type="button"
                        className={stylesButtons.button_secondary_blue}
                        onClick={this.copyMessage}
                    >{__("accessibility.copyNotification")}</button>
                </div>
                <div role="status" className={stylesToasts.copyStatus}>
                    {this.state.copyFeedback === "copied" ? __("accessibility.notificationCopied") :
                        this.state.copyFeedback === "failed" ? __("accessibility.notificationCopyFailed") : ""}
                </div>
                <button
                    type="button"
                    onClick={this.handleClose}
                    className={stylesToasts.closeButton}
                    aria-label={__("accessibility.closeDialog")}
                >
                    <SVG ariaHidden svg={QuitIcon} />
                </button>
            </div>
        );
    }

    private copyMessage = () => {
        try {
            clipboard.writeText(this.props.message, "clipboard");
            this.setState({ copyFeedback: "copied" });
        } catch (_e) {
            this.setState({ copyFeedback: "failed" });
        }
    };

    private handleClose() {
        if (this.state.willLeave) return;
        this.setState({ willLeave: true, opened: false });
        this.fallbackTimer = window.setTimeout(() => {
            if (!this.state.toRemove) {
                console.log("Fallback: Transitionend missed, forcing removal.");
                this.handleTransitionEnd();
            }
        }, 400);
    }

    private handleTransitionEnd() {
        if (this.isRemoving || !this.state.willLeave) return;
        if (this.fallbackTimer) {
            window.clearTimeout(this.fallbackTimer);
            this.fallbackTimer = undefined;
        }
        if (this.state.willLeave) {
            if (!this.state.toRemove) {
                this.setState({ toRemove: true }, () => {
                    this.props.close(this.props.id);
                });
            }
        }
        this.isRemoving = true;
    }
}

const mapStateToProps = (state: IRendererCommonRootState) => ({
    locale: state.i18n.locale, // refresh
});

export default connect(mapStateToProps)(withTranslator(Toast));
