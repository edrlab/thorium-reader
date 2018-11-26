import * as React from "react";

import { Translator } from "readium-desktop/common/services/translator";
import { lazyInject } from "readium-desktop/renderer/di";

import SecondaryHeader from "readium-desktop/renderer/components/SecondaryHeader";

import { Link } from "react-router-dom";

import * as styles from "readium-desktop/renderer/assets/styles/settings.css";

interface Props {
    section: number;
}

export default class SettingsHeader extends React.Component<Props, undefined> {

    @lazyInject("translator")
    private translator: Translator;

    public render(): React.ReactElement<{}> {
        const __ = this.translator.translate.bind(this.translator);

        return (
            <SecondaryHeader className={styles.settings_header}>
                <ul>
                    <li {...(this.props.section === 0 && {className: styles.active})}>
                        <Link to="/settings/tags">
                            Gérer mes tags
                        </Link>
                    </li>
                    <li {...(this.props.section === 2 && {className: styles.active})}>
                        <Link to="/settings/languages">Langue de l'interface</Link>
                    </li>
                </ul>
            </SecondaryHeader>
        );
    }
}
