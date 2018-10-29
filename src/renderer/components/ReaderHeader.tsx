import * as React from "react";

import * as styles from "readium-desktop/renderer/assets/styles/reader-app.css";

import { Translator } from "readium-desktop/common/services/translator";
import { lazyInject } from "readium-desktop/renderer/di";

interface Props {
    menuOpen: boolean;
    settingsOpen: boolean;
    handleMenuClick: () => void;
    handleSettingsClick: () => void;
}

export default class ReaderHeader extends React.Component<Props, undefined> {

    @lazyInject("translator")
    private translator: Translator;

    public render(): React.ReactElement<{}> {
        const __ = this.translator.translate.bind(this.translator);

        return (
            <nav className={styles.main_navigation} role="navigation" aria-label="Menu principal">
                <ul>
                    <li>
                        <button
                            className={styles.menu_button}
                        >
                            <img src="src/renderer/assets/icons/baseline-arrow_back-24px-grey.svg"
                            alt="retour à l'accueil"/>
                        </button>
                    </li>
                    <li>
                        <button
                            className={styles.menu_button}
                        >
                            <img src="src/renderer/assets/icons/outline-info-24px.svg"
                            alt="retour à l'accueil"/>
                        </button>
                    </li>
                    <li>
                        <button
                            className={styles.menu_button}
                        >
                            <img src="src/renderer/assets/icons/outline-flip_to_front-24px.svg"
                            alt="retour à l'accueil"/>
                        </button>
                    </li>
                    <li  className={styles.right + " " + styles.blue}>
                        <button
                            className={styles.menu_button}
                        >
                            <img src="src/renderer/assets/icons/sharp-crop_free-24px.svg"
                            alt="retour à l'accueil"/>
                        </button>
                    </li>
                    <li
                        className={styles.right}
                        {...(this.props.menuOpen && {style: {backgroundColor: "rgb(193, 193, 193)"}})}
                    >
                        <button
                            className={styles.menu_button}
                            onClick={this.props.handleMenuClick.bind(this)}
                        >
                            <img src="src/renderer/assets/icons/open_book.svg"
                            alt="open menu"/>
                        </button>
                    </li>
                    <li className={styles.right}>
                        <button
                            className={styles.menu_button}
                        >
                            <img src="src/renderer/assets/icons/outline-bookmark_border-24px.svg"
                            alt="retour à l'accueil"/>
                        </button>
                    </li>
                    <li
                        className={styles.right}
                        {...(this.props.settingsOpen && {style: {backgroundColor: "rgb(193, 193, 193)"}})}
                    >
                        <button
                            className={styles.menu_button}
                            onClick={this.props.handleSettingsClick.bind(this)}
                        >
                            <img src="src/renderer/assets/icons/font-size.svg"
                            alt="settings"/>
                        </button>
                    </li>
                    <li className={styles.right}>
                        <button
                            className={styles.menu_button}
                        >
                            <img src="src/renderer/assets/icons/baseline-volume_up-24px.svg"
                            alt="retour à l'accueil"/>
                        </button>
                    </li>
                </ul>
            </nav>
        );
    }
}
