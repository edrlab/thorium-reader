import * as React from "react";

import * as styles from "readium-desktop/renderer/assets/styles/header.css";

import { Translator } from "readium-desktop/common/services/translator";
import { lazyInject } from "readium-desktop/renderer/di";

import * as BackIcon from "readium-desktop/renderer/assets/icons/baseline-arrow_back-24px-grey.svg";

import SVG from "readium-desktop/renderer/components/utils/SVG";

interface Props {
    activePage: number;
    handlePageClick: (id: number) => void;
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
                        <a onClick={() => this.props.handlePageClick(0)}>Mes Livres</a>
                    </li>
                    <li {...(activePage === 1 && {className: styles.active})}>
                        <a onClick={() => this.props.handlePageClick(1)}>Catalogues</a>
                    </li>
                    <li className={styles.preferences + (activePage === 2 ? " " + styles.active : "")}>
                        <a onClick={() => this.props.handlePageClick(2)}>Préférences</a>
                    </li>
                </ul>
            </nav>
        );
    }
}
