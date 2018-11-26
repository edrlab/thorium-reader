import * as React from "react";

import * as styles from "readium-desktop/renderer/assets/styles/dialog.css";

import { Translator } from "readium-desktop/common/services/translator";
import { lazyInject } from "readium-desktop/renderer/di";

import * as QuitIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px.svg";

import SVG from "readium-desktop/renderer/components/utils/SVG";

interface Props {
    open: boolean;
    close: () => void;
    className?: string;
    id?: string;
}

export default class BookDetailsDialog extends React.Component<Props, undefined> {
    @lazyInject("translator")
    private translator: Translator;

    public render(): React.ReactElement<{}> {
        const __ = this.translator.translate.bind(this.translator);
        const content = this.props.children;
        const className = this.props.className;

        return (
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
                        aria-label="Fermer"
                        title="Fermer cette fenêtre modale"
                        data-dismiss="dialog"
                        onClick={this.props.close}
                    >
                        <SVG svg={QuitIcon}/>
                    </button>
                </div>
            </div>
        );
    }
}
