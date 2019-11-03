// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { setLocale } from "readium-desktop/common/redux/actions/i18n";
import { AvailableLanguages } from "readium-desktop/common/services/translator";
import * as DoneIcon from "readium-desktop/renderer/assets/icons/done.svg";
import * as styles from "readium-desktop/renderer/assets/styles/settings.css";
import LibraryLayout from "readium-desktop/renderer/components/layout/LibraryLayout";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import { RootState } from "readium-desktop/renderer/redux/states";
import { TDispatch } from "readium-desktop/typings/redux";

import SVG from "../utils/SVG";

interface IProps extends TranslatorProps, ReturnType<typeof mapStateToProps>, ReturnType<typeof mapDispatchToProps> {
}

class LanguageSettings extends React.Component<IProps> {

    public render(): React.ReactElement<{}> {
        const { __ } = this.props;
        return (
            <>
                <LibraryLayout title={__("header.settings")}>
                    <div className={styles.section_title}>{ __("settings.language.languageChoice")}</div>
                    <form className={styles.languages_list}>
                            { Object.keys(AvailableLanguages).map((lang: string, i: number) =>
                                <div key={i}>
                                    <input
                                        id={"radio-" + lang}
                                        type="radio"
                                        lang={lang}
                                        name="language"
                                        onChange={() => this.props.setLocale(lang)}
                                        checked={this.props.locale === lang}
                                    />
                                    <label htmlFor={"radio-" + lang}>
                                        { this.props.locale === lang && <SVG svg={DoneIcon} ariaHidden/>}
                                        { (AvailableLanguages as any)[lang] }
                                    </label>
                                </div>,
                            )}
                    </form>
                </LibraryLayout>
            </>
        );
    }
}

const mapStateToProps = (state: RootState) => {
    return {
        locale: state.i18n.locale,
    };
};

const mapDispatchToProps = (dispatch: TDispatch) => {
    return {
        setLocale: (locale: string) => dispatch(setLocale(locale)),
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(LanguageSettings));
