// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { clipboard } from "electron";
import classNames from "classnames";
import * as React from "react";
import { ToastType } from "readium-desktop/common/models/toast";
import { _APP_NAME } from "readium-desktop/preprocessor-directives";
import * as QuitIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px.svg";
import * as PlusIcon from "readium-desktop/renderer/assets/icons/plus.svg";
import * as stylesToasts from "readium-desktop/renderer/assets/styles/components/toasts.css";
import SVG from "readium-desktop/renderer/common/components/SVG";
import { connect } from "react-redux";
import { TDispatch } from "readium-desktop/typings/redux";
import { DialogTypeName } from "readium-desktop/common/models/dialog";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";

import { TranslatorProps, withTranslator } from "../hoc/translator";

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
interface IProps extends IBaseProps, ReturnType<typeof mapDispatchToProps>  {
}

interface IState {
    willLeave: boolean;
    toRemove: boolean;
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
        };

        this.handleTransitionEnd = this.handleTransitionEnd.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.displayToastModal = this.displayToastModal.bind(this);
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
        }, fast ? 500 : 5000);
    }

    public componentDidMount() {
        this.triggerTimer(false);

        if (this.ref?.current) {
            this.ref?.current.addEventListener("transitionend", this.handleTransitionEnd, false);
        }

        // https://www.electronjs.org/docs/latest/tutorial/notifications
        if (this.props.displaySystemNotification) {
            // tslint:disable-next-line: no-unused-expression
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

        const { type } = this.props;
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
                }}
                onMouseOut={() => {
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
                    onFocus={() => {
                        this.cancelTimer(true);
                    }}
                    onClick={() => {
                        const clipBoardType = "clipboard";
                        try {
                            clipboard.writeText(this.props.message, clipBoardType);

                            // https://www.electronjs.org/docs/latest/tutorial/notifications
                            // tslint:disable-next-line: no-unused-expression
                            new Notification(capitalizedAppName, {
                                body: `${this.props.translator.translate("app.edit.copy")} [${this.props.message}]`,
                            });
                            // this.triggerTimer(true);
                            // this.handleClose();
                        } catch (_e) {
                            // ignore
                        }
                    }
                }>{ this.props.message }</p>
                <button
                    onClick={this.displayToastModal}
                    style={{width: "20px"}}
                >
                    <SVG ariaHidden={true} svg={PlusIcon}/>
                </button>
                {/*
                    onBlur={() => {
                        this.triggerTimer(true);
                    }}
                */}
                <button
                    onFocus={() => {
                        this.cancelTimer(true);
                    }}
                    onClick={() => this.handleClose()}
                    className={stylesToasts.closeButton}
                    title={this.props.__("accessibility.closeDialog")}
                >
                    <SVG ariaHidden={true} svg={QuitIcon}/>
                </button>
            </div>
        );
    }

    private handleClose() {
        this.setState({ willLeave: true });
    }

    private handleTransitionEnd() {
        if (this.state.toRemove) {
            this.props.close(this.props.id);
        } else if (this.state.willLeave) {
            this.setState({toRemove: true});
        }
    }

    private displayToastModal() {
        this.props.displayToastModal();
        this.props.close(this.props.id);
    }
}

const mapDispatchToProps = (dispatch: TDispatch, props: IBaseProps) => {
    return {
        displayToastModal: () => {
            dispatch(dialogActions.openRequest.build(DialogTypeName.ToastModal,
                {
                    message: props.message,
                },
            ));
        },
    };
};

export default connect(undefined, mapDispatchToProps)(withTranslator(Toast));
