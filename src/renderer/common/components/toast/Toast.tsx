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
import * as ChevronDownIcon from "readium-desktop/renderer/assets/icons/chevron-down.svg";
import { TranslatorProps, withTranslator } from "../hoc/translator";
import { connect } from "react-redux";
import { IRendererCommonRootState } from "readium-desktop/common/redux/states/rendererCommonRootState";
import { Link } from "react-router-dom";

// import { PublicationView } from "readium-desktop/common/views/publication";

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
    publicationTitle?: string;
    // openReader? : (publicationView: PublicationView) => void;
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
}

export class Toast extends React.Component<IProps, IState> {
    private ref: React.RefObject<HTMLDivElement>;
    private timer: number | undefined;
    private ignoreTimer: boolean | undefined;

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

    public cancelTimer(ignoreTimer: boolean) {
        if (this.timer) {
            window.clearTimeout(this.timer);
            this.timer = undefined;
        }
        if (ignoreTimer) {
            this.ignoreTimer = true;
        }
    }
    public triggerTimer(fast: boolean) {
        this.cancelTimer(false);
        if (this.ignoreTimer) {
            return;
        }

        this.timer = window.setTimeout(() => {
            this.timer = undefined;
            this.handleClose();
        }, fast ? 1000 : 6000);
    }

    public componentDidMount() {
        this.triggerTimer(false);

        if (this.ref?.current) {
            this.ref?.current.addEventListener("transitionend", this.handleTransitionEnd, false);
        }

        // https://www.electronjs.org/docs/latest/tutorial/notifications
        if (this.props.displaySystemNotification) {
            new Notification(capitalizedAppName, {
                body: this.props.message,
            });
        }
    }

    public componentWillRemove() {
        if (this.ref?.current) {
            this.ref?.current.removeEventListener("transitionend", this.handleTransitionEnd, false);
        }
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
                ref={this.ref}
                onMouseMove={() => {
                    this.cancelTimer(false);
                }}
                onClick={() => {
                    this.cancelTimer(true);
                    this.setState({ opened : !this.state.opened });
                }}
                onMouseOut={() => {
                    this.triggerTimer(true);

                }}
                onBlur={() => {
                    this.ignoreTimer = false;
                    this.setState({ opened : false });
                    this.triggerTimer(true);
                }}
                className={classNames(
                    stylesToasts.toast,
                    willLeave && stylesToasts.leave,
                    toRemove && stylesToasts.toRemove,
                    typeClassName,
                )}
            >
                {
                // icon && <SVG className={styles.icon} svg={icon} />
                }
                <p
                    aria-live="assertive"
                    aria-relevant="all"
                    role="alert"
                    tabIndex={0}
                    className={ this.state.opened ? stylesToasts.toast_open : ""}
                    onFocus={() => {
                        this.cancelTimer(true);
                    }}
                    onClick={() => {
                        const clipBoardType = "clipboard";
                        try {
                            clipboard.writeText(this.props.message, clipBoardType);

                            // https://www.electronjs.org/docs/latest/tutorial/notifications
                            new Notification(capitalizedAppName, {
                                body: `${__("app.edit.copy")} [${this.props.message}]`,
                            });
                            // this.triggerTimer(true);
                            // this.handleClose();
                        } catch (_e) {
                            // ignore
                        }
                    }
                }>{this.props.publicationTitle ?
                    <span>
                        {this.props.message}
                        <br/>
                        <Link
                            style={{textDecoration: "underline", fontStyle:"italic", fontWeight: "bold", color: "var(--color-primary)"}}
                            to={{
                                ...location,
                                pathname: "/library",
                                search: `?focus=search&searchValue=${this.props.publicationTitle}`,
                            }}
                            onClick={(e) => {
                                if (e.altKey || e.shiftKey || e.ctrlKey) {
                                    e.preventDefault();
                                    e.currentTarget.click();
                                }
                            }}
                            onKeyDown={(e) => {
                                // if (e.code === "Space") {
                                if (e.key === " " || e.altKey || e.ctrlKey) {
                                    e.preventDefault(); // prevent scroll
                                }
                            }}
                            onKeyUp={(e) => {
                                // Includes screen reader tests:
                                // if (e.code === "Space") { WORKS
                                // if (e.key === "Space") { DOES NOT WORK
                                // if (e.key === "Enter") { WORKS
                                if (e.key === " ") { // WORKS
                                    e.preventDefault();
                                    e.currentTarget.click();
                                }
                            }}
                        >
                        {__("message.import.seeInLibrary")}
                        </Link>
                    </span>
                    :
                    (this.props.message)
                    }</p>
                {/*
                    onBlur={() => {
                        this.triggerTimer(true);
                    }}
                */}
                <button
                    onFocus={() => {
                        this.cancelTimer(true);
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        this.handleClose();
                    }}
                    className={stylesToasts.closeButton}
                    title={this.props.__("accessibility.closeDialog")}
                >
                    {this.state.opened ?
                    <SVG ariaHidden={true} svg={ChevronDownIcon}/>
                    :
                    <SVG ariaHidden={true} svg={QuitIcon}/>}
                </button>
            </div>
        );
    }

    private handleClose() {
        this.setState({ willLeave: true });
        this.setState({ opened : false });
    }

    private handleTransitionEnd() {
        if (this.state.toRemove) {
            this.props.close(this.props.id);
        } else if (this.state.willLeave) {
            this.setState({toRemove: true});
        }
    }
}

const mapStateToProps = (state: IRendererCommonRootState) => ({
    locale: state.i18n.locale, // refresh
});

export default connect(mapStateToProps)(withTranslator(Toast));
