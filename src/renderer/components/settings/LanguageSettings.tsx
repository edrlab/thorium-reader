// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import * as styles from "readium-desktop/renderer/assets/styles/settings.css";

import { AvailableLanguages, Translator } from "readium-desktop/common/services/translator";
import { lazyInject } from "readium-desktop/renderer/di";

import { connect } from "react-redux";

import LibraryLayout from "readium-desktop/renderer/components/layout/LibraryLayout";

import Header from "./Header";

import { setLocale } from "readium-desktop/common/redux/actions/i18n";

interface Props {
    locale: string;
    setLocale: (locale: string) => void;
}

interface States {
    placeholder: any;
}

export class LanguageSettings extends React.Component<Props, States> {
    public constructor(props: Props) {
        super(props);

        this.state = {
            placeholder: undefined,
        };
    }

    public render(): React.ReactElement<{}> {
        return (
            <>
                <LibraryLayout>
                    <Header section={2}/>
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

export default connect(mapStateToProps, mapDispatchToProps)(LanguageSettings);
