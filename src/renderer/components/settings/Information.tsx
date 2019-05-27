// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { connect } from "react-redux";

import LibraryLayout from "readium-desktop/renderer/components/layout/LibraryLayout";

import Header from "./Header";

import { setLocale } from "readium-desktop/common/redux/actions/i18n";

import { TranslatorProps, withTranslator } from "readium-desktop/renderer/components/utils/translator";

import * as fs from "fs";

import * as commonmark from "commonmark";

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

    public componentDidMount() {
        const { locale } = this.props;
        try {
            const fileContent = fs.readFileSync(`src/resources/information/${locale}.md`, {encoding: "utf8"});
            const reader = new commonmark.Parser();
            const writer = new commonmark.HtmlRenderer();
            const parsed = reader.parse(fileContent);
            this.parsedMarkdown = writer.render(parsed);
        } catch {
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
