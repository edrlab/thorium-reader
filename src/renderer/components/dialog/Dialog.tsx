// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import * as styles from "readium-desktop/renderer/assets/styles/dialog.css";

import * as QuitIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px.svg";

import FocusLock from "react-focus-lock";

import SVG from "readium-desktop/renderer/components/utils/SVG";
import { TranslatorProps, withTranslator } from "../utils/translator";

interface Props extends TranslatorProps {
    open: boolean;
    close: () => void;
    className?: string;
    id?: string;
}

export class Dialog extends React.Component<Props, undefined> {
    public render(): React.ReactElement<{}> {
        const content = this.props.children;
        const className = this.props.className;
        const { __ } = this.props;

        return (
            <FocusLock>
                <div
                    id="dialog"
                    role="dialog"
                    aria-labelledby="dialog-title"
                    aria-describedby="dialog-desc"
                    aria-modal="true"
                    aria-hidden={this.props.open ? "false" : "true"}
                    tabIndex={-1}
                    className={styles.c_dialog}
                    style={{visibility: this.props.open ? "visible" : "hidden"}}
                >
                    <div onClick={this.props.close} className={styles.c_dialog_background} />
                    <div
                        role="document"
                        id={this.props.id}
                        className={(className ? className + " " : "") + styles.c_dialog__box}
                    >
                        { content && <>
                            { content }
                        </>}
                        <button
                            className={styles.close_button}
                            type="button"
                            aria-label={__("accessibility.closeDialog")}
                            title={__("dialog.closeModalWindow")}
                            data-dismiss="dialog"
                            onClick={this.props.close}
                        >
                            <SVG svg={QuitIcon}/>
                        </button>
                    </div>
                </div>
            </FocusLock>
        );
    }
}

export default withTranslator(Dialog);
