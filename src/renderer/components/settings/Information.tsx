// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as commonmark from "commonmark";
import * as React from "react";
import { connect } from "react-redux";
import { setLocale } from "readium-desktop/common/redux/actions/i18n";
import * as packageJson from "readium-desktop/package.json";
import LibraryLayout from "readium-desktop/renderer/components/layout/LibraryLayout";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/translator";
import * as info_de from "readium-desktop/resources/information/de.md";
import * as info_en from "readium-desktop/resources/information/en.md";
import * as info_fr from "readium-desktop/resources/information/fr.md";
import Header from "./Header";

const info: { [key: string]: typeof import("*.md") } = {
    en: info_en,
    fr: info_fr,
    de: info_de,
};

interface Props extends TranslatorProps {
    locale: string;
    setLocale: (locale: string) => void;
}

interface States {
    placeholder: any;
}

export class LanguageSettings extends React.Component<Props, States> {
    private parsedMarkdown: string;

    public constructor(props: Props) {
        super(props);

        this.state = {
            placeholder: undefined,
        };
    }

    public async componentDidMount() {
        const { locale } = this.props;
        if (info[locale]) {
            let fileContent = info[locale] as unknown as string;
            if ((packageJson as any).version) {
                fileContent = fileContent.replace("{{version}}", (packageJson as any).version);
            }
            this.parsedMarkdown = (new commonmark.HtmlRenderer()).render((new commonmark.Parser()).parse(fileContent));
        } else {
            this.parsedMarkdown = "<h1>There is no information for your language</h1>";
        }
        this.forceUpdate();
    }

    public render(): React.ReactElement<{}> {
        const html = { __html: this.parsedMarkdown };
        const secondaryHeader = <Header section={3}/>;
        const { __ } = this.props;
        return (
            <>
                <LibraryLayout secondaryHeader={secondaryHeader} title={__("header.settings")}>
                    <div dangerouslySetInnerHTML={html}></div>
                </LibraryLayout>
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

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(LanguageSettings));
