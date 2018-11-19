import * as React from "react";

import * as styles from "readium-desktop/renderer/assets/styles/header.css";

import { Translator } from "readium-desktop/common/services/translator";
import { lazyInject } from "readium-desktop/renderer/di";

import { Link } from "react-router-dom";

interface Props {
    activePage: number;
}

export default class Header extends React.Component<Props, undefined> {

    @lazyInject("translator")
    private translator: Translator;

    public render(): React.ReactElement<{}> {
        const __ = this.translator.translate.bind(this.translator);
        const activePage = this.props.activePage;
        return (
            <nav className={styles.main_navigation} role="navigation" aria-label="Menu principal">
                <ul>
                    <li {...(activePage === 0 && {className: styles.active})}>
                        <Link to={"/"} replace={true}>
                            Mes Livres
                        </Link>
                    </li>
                    <li {...(activePage === 1 && {className: styles.active})}>
                        <Link to={"/catalog"} replace={true}>
                            Catalogues
                        </Link>
                    </li>
                    <li className={styles.preferences + (activePage === 2 ? " " + styles.active : "")}>
                        <Link to={"/settings"} replace={true}>
                            Préférences
                        </Link>
                    </li>
                </ul>
            </nav>
        );
    }
}
