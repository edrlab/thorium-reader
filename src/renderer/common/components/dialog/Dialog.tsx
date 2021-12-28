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
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.css";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.css";
import * as stylesModals from "readium-desktop/renderer/assets/styles/components/modals.css";
import SVG from "readium-desktop/renderer/common/components/SVG";

import { TranslatorProps, withTranslator } from "../hoc/translator";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
    open: boolean;
    close: () => void;
    className?: string;
    id?: string;
    title: string;
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps {
}

class Dialog extends React.Component<IProps, undefined> {
    private appElement: HTMLElement;
    private appOverlayElement: HTMLElement;
    private rootElement: HTMLElement;

    constructor(props: IProps) {
        super(props);

        this.appElement = document.getElementById("app");
        this.appOverlayElement = document.getElementById("app-overlay");
        this.rootElement = document.createElement("div");

        this.handleKeyPress = this.handleKeyPress.bind(this);
    }
    public componentDidMount() {
        this.appElement.setAttribute("aria-hidden", "true");
        this.appOverlayElement.appendChild(this.rootElement);

        document.addEventListener("keydown", this.handleKeyPress);
    }
    public componentWillUnmount() {
        this.appElement.setAttribute("aria-hidden", "false");
        this.appOverlayElement.removeChild(this.rootElement);

        document.removeEventListener("keydown", this.handleKeyPress);
    }

    public render(): React.ReactElement<{}> {
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
                        aria-hidden={this.props.open ? "false" : "true"}
                        tabIndex={-1}
                        className={this.props.open ? stylesModals.modal_dialog_overlay : stylesGlobal.visibility_hidden}
                    >
                        <div onClick={this.props.close} className={stylesModals.modal_dialog_overlay_hidden} />
                        <div
                            role="document"
                            id={this.props.id}
                            className={classNames(className, stylesModals.modal_dialog)}
                        >
                            <div className={stylesModals.modal_dialog_header}>
                                <h2>{this.props.title}</h2>
                                <button
                                    type="button"
                                    aria-label={__("accessibility.closeDialog")}
                                    title={__("dialog.closeModalWindow")}
                                    data-dismiss="dialog"
                                    onClick={this.props.close}
                                    className={stylesButtons.button_transparency_icon}
                                >
                                    <SVG svg={QuitIcon} />
                                </button>
                            </div>
                            {content && <>
                                {content}
                            </>}
                        </div>
                    </div>
                </FocusLock>
            ),
            this.rootElement,
        );
    }

    private handleKeyPress(e: KeyboardEvent) {
        if (e.key === "Escape") {
            this.props.close();
        }
    }
}

export default withTranslator(Dialog);
