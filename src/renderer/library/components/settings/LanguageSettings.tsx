// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import classNames from "classnames";
import * as React from "react";
import { connect } from "react-redux";
import {
    _defaults, keyboardShortcutMatch_, TKeyboardShortcut, TKeyboardShortcutId,
    TKeyboardShortcutsMap, TKeyboardShortcutsMapReadOnly,
} from "readium-desktop/common/keyboard";
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

interface IState {
    displayKeyboardShortcuts: boolean;
    editKeyboardShortcut: TKeyboardShortcutId | undefined;
    keyboardShortcuts: TKeyboardShortcutsMap | undefined;
}

class LanguageSettings extends React.Component<IProps, IState> {

    constructor(props: IProps) {
        super(props);

        this.state = {
            displayKeyboardShortcuts: false,
            editKeyboardShortcut: undefined,
            keyboardShortcuts: undefined,
        };
    }

    public componentDidUpdate(_oldProps: IProps) {
        // console.log("componentDidUpdate:");
        // console.log(JSON.stringify(_oldProps.keyboardShortcuts, null, 4));
        // console.log(JSON.stringify(this.props.keyboardShortcuts, null, 4));

        if (this.keyboardShortcutsIdentical(this.props.keyboardShortcuts, _oldProps.keyboardShortcuts)) {
            console.log("### componentDidUpdate keyboardShortcutsIdentical");
            return;
        }

        this.transferKeyboardShortcutsImmutablePropsToMutableLocalState();
    }

    public componentDidMount() {
        this.transferKeyboardShortcutsImmutablePropsToMutableLocalState();
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
                            className={
                                classNames(styles.keyboard_shortcuts_button, styles.keyboard_shortcuts_button_primary)
                            }
                            onClick={() => this.onClickKeyboardShortcutsShowHide()}>
                            {this.state.displayKeyboardShortcuts ? __("settings.keyboard.hide") : __("settings.keyboard.show")}
                        </button>
                        <button
                            className={classNames(styles.keyboard_shortcuts_button,
                                !this.state.displayKeyboardShortcuts ? styles.keyboard_shortcuts_button_hide : null)}
                            onClick={() => this.onClickKeyboardShortcutsShow()}>
                            {`${__("settings.keyboard.open")} / ${__("settings.keyboard.edit")} (JSON)`}
                        </button>
                        <button
                            className={classNames(styles.keyboard_shortcuts_button,
                                !this.state.displayKeyboardShortcuts ? styles.keyboard_shortcuts_button_hide : null)}
                            onClick={() => this.onClickKeyboardShortcutsReload(false)}>
                            {`${__("settings.keyboard.reload")} (${__("settings.keyboard.user")})`}
                        </button>
                        <button
                            className={classNames(styles.keyboard_shortcuts_button,
                                !this.state.displayKeyboardShortcuts ? styles.keyboard_shortcuts_button_hide : null)}
                            onClick={() => this.onClickKeyboardShortcutsReload(true)}>
                            {`${__("settings.keyboard.reset")} (${__("settings.keyboard.defaults")})`}
                        </button>
                    </section>
                    {this.state.displayKeyboardShortcuts && (
                        <div>
                            <ul className={styles.keyboard_shortcuts_list}>
                            {this.state.keyboardShortcuts && Object.keys(this.state.keyboardShortcuts).map((id_) => {
                                const id = id_ as TKeyboardShortcutId;
                                const def = this.state.keyboardShortcuts[id];
                                return <li className={
                                    this.state.editKeyboardShortcut === id ? styles.keyboard_shortcuts_edit_li : null
                                    }
                                    key={`key_${id}`}>
                                    <button
                                        className={styles.keyboard_shortcuts_edit_save_button}
                                        onClick={() => this.onClickKeyboardShortcutEdit(id)}>
                                        {this.state.editKeyboardShortcut === id ?
                                        __("settings.keyboard.save") : __("settings.keyboard.edit")}
                                    </button>
                                    {(this.state.editKeyboardShortcut === id) &&
                                    <button
                                        className={styles.keyboard_shortcuts_edit_save_button}
                                        onClick={() => this.onClickKeyboardShortcutEdit(id)}>
                                        {__("settings.keyboard.cancel")}
                                    </button>
                                    }

                                    <strong className={
                                        this.state.editKeyboardShortcut === id ?
                                        styles.keyboard_shortcuts_edit_title
                                        : null
                                        }>{id}</strong>
                                    <div className={
                                        this.state.editKeyboardShortcut === id ?
                                        styles.keyboard_shortcuts_edit_div
                                        : null
                                        }>{
                                        this.state.editKeyboardShortcut === id ?
                                        this.editifyKeyboardShortcut(id, def)
                                        :
                                        this.prettifyKeyboardShortcut(def)
                                    }</div>
                                </li>;
                            })}
                            </ul>
                        </div>
                    )}
                </LibraryLayout>
            </>
        );
    }

    private keyboardShortcutsIdentical(k1: TKeyboardShortcutsMapReadOnly, k2: TKeyboardShortcutsMap): boolean {

        if (k1 === k2) {
            return true;
        }
        if (!k1 && !k2) {
            return true;
        }
        if (!k2 && k1 || k2 && !k1) {
            return false;
        }

        for (const id_ in k1) {
            // just good practice
            if (!k1.hasOwnProperty(id_)) {
                continue;
            }
            const id = id_ as TKeyboardShortcutId;
            // filters out non-recognised names
            if (!_defaults[id]) {
                continue;
            }
            // filters out non-object values
            if (typeof k1[id] !== "object") {
                continue;
            }
            if (!k2.hasOwnProperty(id)) {
                return false;
            }
            if (!k1[id] && k2[id]) {
                return false;
            }
            if (k1[id] && !k2[id]) {
                return false;
            }
            if (!keyboardShortcutMatch_(k1[id], k2[id])) {
                return false;
            }
        }

        return true;
    }

    private transferKeyboardShortcutsImmutablePropsToMutableLocalState() {

        // console.log("transferKeyboardShortcutsImmutablePropsToMutableLocalState:");
        // console.log(JSON.stringify(this.props.keyboardShortcuts, null, 4));
        // console.log(JSON.stringify(this.state.keyboardShortcuts, null, 4));

        if (this.keyboardShortcutsIdentical(this.props.keyboardShortcuts, this.state.keyboardShortcuts)) {
            console.log("### transferKeyboardShortcutsImmutablePropsToMutableLocalState keyboardShortcutsIdentical");
            return;
        }
        const keys = JSON.parse(JSON.stringify(this.props.keyboardShortcuts)) as TKeyboardShortcutsMap; // mutable clone
        this.setState({
            keyboardShortcuts: keys,
        });
    }

    private onClickKeyboardShortcutEdit(id: TKeyboardShortcutId) {
        this.setState({ editKeyboardShortcut: this.state.editKeyboardShortcut === id ? undefined : id });
    }
    private onClickKeyboardShortcutsShowHide() {
        this.setState({
            displayKeyboardShortcuts: !this.state.displayKeyboardShortcuts,
            editKeyboardShortcut: this.state.displayKeyboardShortcuts ? undefined : this.state.editKeyboardShortcut,
        });
    }
    private onClickKeyboardShortcutsShow() {
        this.props.showKeyboardShortcuts();
    }
    private onClickKeyboardShortcutsReload(defaults: boolean) {
        this.props.reloadKeyboardShortcuts(defaults);
    }

    private prettifyKeyboardShortcut(def: TKeyboardShortcut) {
        const alt = def.alt ? <span className={styles.keyboard_shortcuts_key}>ALT</span> : <></>;
        const shift = def.shift ? <span className={styles.keyboard_shortcuts_key}>SHIFT</span> : <></>;
        const control = def.control ? <span className={styles.keyboard_shortcuts_key}>CTRL</span> : <></>;
        const meta = def.meta ? <span className={styles.keyboard_shortcuts_key}>META</span> : <></>;
        const key = <span className={styles.keyboard_shortcuts_key}>{def.key}</span>;
        return <>{shift}{control}{alt}{meta}{key}</>;
    }

    private editifyKeyboardShortcut(id: TKeyboardShortcutId, def: TKeyboardShortcut) {
        const alt = <button
            onClick={() => {
                const keyboardShortcuts = this.state.keyboardShortcuts;
                if (!keyboardShortcuts) {
                    return;
                }
                keyboardShortcuts[id].alt = !def.alt;
                console.log("editifyKeyboardShortcut ALT:");
                console.log(JSON.stringify(keyboardShortcuts, null, 4));
                this.setState({
                    keyboardShortcuts,
                });
            }}
            className={classNames(styles.keyboard_shortcuts_key,
                def.alt ? styles.keyboard_shortcuts_key_on : styles.keyboard_shortcuts_key_off)
            } data-keyid={id}>ALT</button>;

        const shift = <button
            onClick={() => {
                const keyboardShortcuts = this.state.keyboardShortcuts;
                if (!keyboardShortcuts) {
                    return;
                }
                keyboardShortcuts[id].shift = !def.shift;
                console.log("editifyKeyboardShortcut SHIFT:");
                console.log(JSON.stringify(keyboardShortcuts, null, 4));
                this.setState({
                    keyboardShortcuts,
                });
            }}
            className={classNames(styles.keyboard_shortcuts_key,
                def.shift ? styles.keyboard_shortcuts_key_on : styles.keyboard_shortcuts_key_off)
            } data-keyid={id}>SHIFT</button>;

        const control = <button
            onClick={() => {
                const keyboardShortcuts = this.state.keyboardShortcuts;
                if (!keyboardShortcuts) {
                    return;
                }
                keyboardShortcuts[id].control = !def.control;
                console.log("editifyKeyboardShortcut CTRL:");
                console.log(JSON.stringify(keyboardShortcuts, null, 4));
                this.setState({
                    keyboardShortcuts,
                });
            }}
            className={classNames(styles.keyboard_shortcuts_key,
                def.control ? styles.keyboard_shortcuts_key_on : styles.keyboard_shortcuts_key_off)
            } data-keyid={id}>CTRL</button>;

        const meta = <button
            onClick={() => {
                const keyboardShortcuts = this.state.keyboardShortcuts;
                if (!keyboardShortcuts) {
                    return;
                }
                keyboardShortcuts[id].meta = !def.meta;
                console.log("editifyKeyboardShortcut META:");
                console.log(JSON.stringify(keyboardShortcuts, null, 4));
                this.setState({
                    keyboardShortcuts,
                });
            }}
            className={classNames(styles.keyboard_shortcuts_key,
                def.meta ? styles.keyboard_shortcuts_key_on : styles.keyboard_shortcuts_key_off)
            } data-keyid={id}>META</button>;

        const key = <button className={styles.keyboard_shortcuts_key}>{def.key}</button>;
        return <>{shift}{control}{alt}{meta}{key}</>;
    }
}

const mapStateToProps = (state: ILibraryRootState, _props: IBaseProps) => {
    return {
        locale: state.i18n.locale,
        keyboardShortcuts: state.keyboard.shortcuts,
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
