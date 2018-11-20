import * as React from "react";

import * as styles from "readium-desktop/renderer/assets/styles/myBooks.css";

import { Translator } from "readium-desktop/common/services/translator";
import { lazyInject } from "readium-desktop/renderer/di";

import { connect } from "react-redux";
import Header from "readium-desktop/renderer/components/Header";
import SettingsHeader from "readium-desktop/renderer/components/settings/SettingsHeader";

import { Catalog } from "readium-desktop/common/models/catalog";

interface Props {
    catalog: Catalog;
}

interface States {
    placeholder: any;
}

export class SettingsTags extends React.Component<Props, States> {

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
                <SettingsHeader section={0} />
                <main id={styles.main} role="main">
                    <a id="contenu" tabIndex={-1}></a>
                    SETTINGS TAGS
                </main>
            </>
        );
    }
}

const mapStateToProps = (state: any) => {
    return {
        catalog: {
            title: "My Books",
            publications: state.catalog.publications,
        },
    };
};

export default connect(mapStateToProps)(SettingsTags);
