import * as React from "react";

import * as styles from "readium-desktop/renderer/assets/styles/settings.css";

import { AvailableLanguages, Translator } from "readium-desktop/common/services/translator";
import { lazyInject } from "readium-desktop/renderer/di";

import { connect } from "react-redux";
import Header from "readium-desktop/renderer/components/Header";
import SettingsHeader from "readium-desktop/renderer/components/settings/SettingsHeader";

import { setLocale } from "readium-desktop/common/redux/actions/i18n";

interface Props {
    locale: string;
    setLocale: (locale: string) => void;
}

interface States {
    placeholder: any;
}

export class SettingsLanguages extends React.Component<Props, States> {

    @lazyInject("translator")
    private translator: Translator;

    public constructor(props: Props) {
        super(props);

        this.state = {
            placeholder: undefined,
        };
    }

    public render(): React.ReactElement<{}> {
        const __ = this.translator.translate.bind(this.translator);

        return (
            <>
                <Header activePage={2}/>
                <SettingsHeader section={2} />
                <main id={styles.main} role="main">
                    <a id="contenu" tabIndex={-1}></a>
                    <div className={styles.section_title}>Choix de la langue</div>
                    <ul className={styles.languages_list}>
                        { Object.keys(AvailableLanguages).map((lang: string, i: number) =>
                            <li
                                key={i}
                                lang={lang}
                                onClick={() => this.props.setLocale(lang)}
                                {...(this.props.locale === lang && {className: styles.active})}
                                >
                                { (AvailableLanguages as any)[lang] }
                            </li>,
                        )}
                    </ul>
                </main>
            </>
        );
    }
}

const mapStateToProps = (state: any) => {
    return {
        locale: state.i18n.locale,
    };
};

const mapDispatchToProps = (dispatch: any) => {
    return {
      setLocale: (locale: string) => dispatch(setLocale(locale)),
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(SettingsLanguages);
