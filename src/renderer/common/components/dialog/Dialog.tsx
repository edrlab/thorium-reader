// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import classNames from "classnames";
import * as React from "react";
import * as ReactDOM from "react-dom";
import FocusLock from "react-focus-lock";
import * as QuitIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px.svg";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as stylesModals from "readium-desktop/renderer/assets/styles/components/modals.scss";
import SVG from "readium-desktop/renderer/common/components/SVG";

import { TranslatorProps, withTranslator } from "../hoc/translator";
import { TDispatch } from "readium-desktop/typings/redux";
import { dialogActions } from "readium-desktop/common/redux/actions";
import { connect } from "react-redux";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
    className?: string;
    id?: string;
    title: string;
    children: React.ReactNode;
    onSubmitButton?: () => void;
    submitButtonTitle?: string;
    submitButtonDisabled?: boolean;
    shouldOkRefEnabled?: boolean;
    noFooter?: boolean;
    noCentering?: boolean;
    close?: () => void;
    size?: "small" | "full";
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapDispatchToProps> {
}

class Dialog extends React.Component<React.PropsWithChildren<IProps>, undefined> {
    private appElement: HTMLElement;
    private appOverlayElement: HTMLElement;
    private rootElement: HTMLElement;
    private okRef: React.RefObject<HTMLButtonElement>;

    constructor(props: IProps) {
        super(props);

        this.appElement = document.getElementById("app");
        this.appOverlayElement = document.getElementById("app-overlay");
        this.rootElement = document.createElement("div");

        this.okRef = React.createRef<HTMLButtonElement>();
    }
    public componentDidMount() {
        this.appElement.setAttribute("aria-hidden", "true");
        this.appOverlayElement.appendChild(this.rootElement);

        // alert(this.props.shouldOkRefEnabled + " " + this.okRef?.current);
        if (this.props.shouldOkRefEnabled && this.okRef?.current) {
            setTimeout(() => {
                this.okRef.current.focus();
            }, 0);
        }
    }
    public componentWillUnmount() {
        this.appElement.setAttribute("aria-hidden", "false");
        this.appOverlayElement.removeChild(this.rootElement);
    }

    public render(): React.ReactNode {
        const content = this.props.children;
        // const dialogTitle = this.props.children;
        const className = this.props.className;
        const { __ } = this.props;
        return ReactDOM.createPortal(
            (
                <FocusLock>
                    <div
                        id="dialog"
                        role="dialog"
                        aria-labelledby="dialog-title"
                        aria-describedby="dialog-desc"
                        aria-modal="true"
                        aria-hidden={"false"}
                        tabIndex={-1}

                        className={stylesModals.modal_dialog_overlay}
                        onKeyDown={this.handleKeyPress}
                    >
                        <div
                            onClick={(_e) => {
                                this.props.closeDialog();
                            }}
                            className={stylesModals.modal_dialog_overlay_hidden}
                        />
                        <div
                            role="document"
                            id={this.props.id}
                            className={classNames(className, stylesModals.modal_dialog, this.props.size === "small" ? undefined : stylesModals.modal_dialog_full )}
                        >
                            <div className={stylesModals.modal_dialog_header}>
                                <h2>{this.props.title}</h2>
                                <button
                                    type="button"
                                    aria-label={__("accessibility.closeDialog")}
                                    title={__("dialog.closeModalWindow")}
                                    data-dismiss="dialog"
                                    onClick={(_e) => {
                                        this.props.closeDialog();
                                    }}
                                    className={stylesButtons.button_transparency_icon}
                                >
                                    <SVG ariaHidden={true} svg={QuitIcon} />
                                </button>
                            </div>
                            {
                                // causes problems with keyboard focus handling, see onKeyUp/onKeyDown explanation below
                                // <form className={stylesModals.modal_dialog_form_wrapper}
                                //         onSubmit={this.submitForm}
                                //     ></form>
                                this.props.noFooter // cf PublicationInfoManager
                                    ? <div
                                            className={classNames(stylesModals.modal_dialog_body)}
                                        >
                                            {content}
                                        </div>
                                    : <>
                                        <div
                                            className={classNames(stylesModals.modal_dialog_body, this.props.noCentering ? undefined : stylesModals.modal_dialog_body_centered)}

                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" && (e.target as HTMLElement)?.tagName === "INPUT" && !this.props.submitButtonDisabled) {
                                                    this.submitForm(e);
                                                }
                                            }

//                                             onKeyDown={(e) => {
//                                                 // See onKeyUp below for explanation
// console.log("DIALOG DIV KEY DOWN ", e.key, (e.target as HTMLElement)?.tagName);
//                                                 if (e.key === "Enter" && (e.target as HTMLElement)?.tagName === "INPUT") {
//                                                     // e.stopPropagation();
//                                                     e.preventDefault();
//                                                 }
//                                             }}
//                                             onKeyUp={(e) => {
//                                                 // WARNING: onKeyUp alone here instead of onKeyDown (or onKeyDown alone too) causes the footer cancel button below to trigger when the keyboard focus is located inside a text input!! (crazy Chromium bug? or normal form/submit edge case due to submit button being disabled??) The onKeyDown above fixes this, but a problem remains: keyUp is captured immediately after pressing ENTER (full click event) on the calling site button that opens the popup dialog, resulting in the modal closing immediately! (thus the additional required check for matching keyDown)
// console.log("DIALOG DIV KEY UP ", e.key, (e.target as HTMLElement)?.tagName);
//                                                 if (e.key === "Enter" && (e.target as HTMLElement)?.tagName === "INPUT" && !this.props.submitButtonDisabled) {
//                                                     this.submitForm(e);
//                                                 }
//                                             }}
                                            }
                                        >
                                            {content}
                                        </div>
                                        <div className={stylesModals.modal_dialog_footer}>
                                            <button
                                                onClick={(_e) => {
                                                    this.props.closeDialog();
                                                }}
                                                className={stylesButtons.button_primary}
                                            >
                                                {__("dialog.cancel")}
                                            </button>
                                            <button
                                                disabled={
                                                    /* type="submit" with actual form HTML element causes keyboard focus bug, see onKeyDown/onKeyUp explanation above */
                                                    this.props.submitButtonDisabled || false
                                                }
                                                onClick={(e) => {
                                                    this.submitForm(e);
                                                }}

                                                className={classNames(stylesButtons.button_primary, stylesButtons.button_primary_form_default)}
                                                ref={this.okRef}
                                            >
                                                {this.props.submitButtonTitle}
                                            </button>
                                        </div>
                                    </>
                            }
                        </div>
                    </div>
                </FocusLock>
            ),
            this.rootElement,
        );
    }

    private submitForm = (e: React.FormEvent<HTMLFormElement> | React.KeyboardEvent<HTMLDivElement> | React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.preventDefault();
        this.submit();
    };

    private submit = () => {
        if (this.props.onSubmitButton) {
            this.props.onSubmitButton();
        }
        this.props.closeDialog();
    };

    private handleKeyPress: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
        if (e.key === "Escape") {
            if (this.props.close) {
                this.props.close();
            } else {
                this.props.closeDialog();
            }
        }
    };
}

const mapDispatchToProps = (dispatch: TDispatch, _props: IBaseProps) => {
    return {
        closeDialog: () => {
            dispatch(
                dialogActions.closeRequest.build(),
            );
        },
    };
};



export default connect(undefined, mapDispatchToProps)(withTranslator(Dialog));
