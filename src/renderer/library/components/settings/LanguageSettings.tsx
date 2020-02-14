// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { i18nActions, keyboardActions } from "readium-desktop/common/redux/actions/";
import { AvailableLanguages } from "readium-desktop/common/services/translator";
import * as DoneIcon from "readium-desktop/renderer/assets/icons/done.svg";
import * as styles from "readium-desktop/renderer/assets/styles/settings.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import LibraryLayout from "readium-desktop/renderer/library/components/layout/LibraryLayout";
import { ILibraryRootState } from "readium-desktop/renderer/library/redux/states";
import { TDispatch } from "readium-desktop/typings/redux";
import { ObjectKeys } from "readium-desktop/utils/object-keys-values";

import SVG from "../../../common/components/SVG";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps>, ReturnType<typeof mapDispatchToProps> {
}

class LanguageSettings extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);
    }

    public render(): React.ReactElement<{}> {
        const { __ } = this.props;
        return (
            <>
                <LibraryLayout title={__("header.settings")}>
                    <div className={styles.section_title}>{ __("settings.language.languageChoice")}</div>
                    <form className={styles.languages_list}>
                            { ObjectKeys(AvailableLanguages).map((lang, i) =>
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
                                        { AvailableLanguages[lang] }
                                    </label>
                                </div>,
                            )}
                    </form>

                    <div className={styles.section_title}>{ __("settings.keyboard.keyboardShortcuts")}</div>
                    <section className={styles.keyboard_shortcuts_section}>
                        <button
                            className={styles.keyboard_shortcuts_button}
                            onClick={() => this.onClickKeyboardShortcutsShow()}>
                            {__("settings.keyboard.open")}
                        </button>
                        <button
                            className={styles.keyboard_shortcuts_button}
                            onClick={() => this.onClickKeyboardShortcutsReload(false)}>
                            {`${__("settings.keyboard.reload")} (${__("settings.keyboard.user")})`}
                        </button>
                        <button
                            className={styles.keyboard_shortcuts_button}
                            onClick={() => this.onClickKeyboardShortcutsReload(true)}>
                            {`${__("settings.keyboard.reload")} (${__("settings.keyboard.defaults")})`}
                        </button>
                    </section>
                </LibraryLayout>
            </>
        );
    }
    private onClickKeyboardShortcutsShow() {
        this.props.showKeyboardShortcuts();
    }
    private onClickKeyboardShortcutsReload(defaults: boolean) {
        this.props.reloadKeyboardShortcuts(defaults);
    }
}

const mapStateToProps = (state: ILibraryRootState, _props: IBaseProps) => {
    return {
        locale: state.i18n.locale,
    };
};

const mapDispatchToProps = (dispatch: TDispatch, _props: IBaseProps) => {
    return {
        setLocale: (locale: string) => dispatch(i18nActions.setLocale.build(locale)),
        showKeyboardShortcuts: () => dispatch(keyboardActions.showShortcuts.build(true)),
        reloadKeyboardShortcuts: (defaults: boolean) => dispatch(keyboardActions.reloadShortcuts.build(defaults)),
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(LanguageSettings));
