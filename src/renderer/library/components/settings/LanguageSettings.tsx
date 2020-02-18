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
    TKeyboardShortcut, TKeyboardShortcutId, TKeyboardShortcutsMap, TKeyboardShortcutsMapReadOnly,
} from "readium-desktop/common/keyboard";
import { i18nActions, keyboardActions } from "readium-desktop/common/redux/actions/";
import { AvailableLanguages } from "readium-desktop/common/services/translator";
import * as DoneIcon from "readium-desktop/renderer/assets/icons/done.svg";
import * as MenuIcon from "readium-desktop/renderer/assets/icons/menu.svg";
import * as styles from "readium-desktop/renderer/assets/styles/settings.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import Menu from "readium-desktop/renderer/common/components/menu/Menu";
import LibraryLayout from "readium-desktop/renderer/library/components/layout/LibraryLayout";
import { ILibraryRootState } from "readium-desktop/renderer/library/redux/states";
import { TDispatch } from "readium-desktop/typings/redux";
import { ObjectKeys } from "readium-desktop/utils/object-keys-values";

import { sortObject } from "@r2-utils-js/_utils/JsonUtils";

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
    editKeyboardShortcutId: TKeyboardShortcutId | undefined;
    editKeyboardShortcutData: TKeyboardShortcut | undefined;
    menuOpen: boolean;
}

const _keyOptionsFunctions = [];
for (let i = 1; i <= 12; i++) {
    _keyOptionsFunctions.push(`F${i}`);
}
const _keyOptionsNumbers = [];
for (let i = 0; i <= 9; i++) {
    _keyOptionsNumbers.push(`Digit${i}`);
}
const _keyOptionsNumpads = [];
for (let i = 0; i <= 9; i++) {
    _keyOptionsNumpads.push(`Numpad${i}`);
}
const _keyOptionsAlpha = [];
for (let i = 0; i < 26; i++) {
    const upper = String.fromCharCode(65 + i); // 97 is lowercase "a"
    _keyOptionsAlpha.push(`Key${upper}`);
}
const _keyOptions = [].concat(
    _keyOptionsFunctions,
    _keyOptionsNumbers,
    _keyOptionsAlpha,
    ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"],
    ["Space", "Enter", "Backspace", "Delete", "BracketRight", "BracketLeft"],
    ["Slash", "Backslash", "IntlBackslash"],
    ["Period", "Comma", "Quote", "Backquote", "Minus", "Equal", "Semicolon"],
    ["CapsLock", "Insert", "PrintScreen"],
    ["NumLock", "NumpadMultiply", "NumpadEqual", "NumpadSubtract", "NumpadDecimal", "NumpadEnter", "NumpadDivide"],
    _keyOptionsNumpads,
);
// https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code/code_values

class LanguageSettings extends React.Component<IProps, IState> {

    private selectRef: React.RefObject<HTMLSelectElement>;

    constructor(props: IProps) {
        super(props);

        this.state = {
            displayKeyboardShortcuts: false,
            editKeyboardShortcutId: undefined,
            editKeyboardShortcutData: undefined,
            menuOpen: false,
        };
        this.openCloseMenu = this.openCloseMenu.bind(this);

        this.selectRef = React.createRef<HTMLSelectElement>();
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
                                classNames(styles.keyboard_shortcuts_button,
                                    styles.keyboard_shortcuts_button_primary,
                                    this.state.displayKeyboardShortcuts ?
                                        styles.keyboard_shortcuts_button_active : null)
                            }
                            onClick={() => this.onClickKeyboardShortcutsShowHide()}>
                            {this.state.displayKeyboardShortcuts ? __("settings.keyboard.hide") : __("settings.keyboard.show")}
                        </button>
                        {(this.state.displayKeyboardShortcuts && !this.state.editKeyboardShortcutId) &&
                        (
                        <Menu
                        button={
                            (<SVG
                                title={
                                `${__("settings.keyboard.advancedMenu")}`
                                }
                                svg={MenuIcon} />)
                            }
                        content={(
                            <div
                                className={styles.keyboard_shortcuts_menu}
                                >
                                <button
                                    className={styles.keyboard_shortcuts_button}
                                    onClick={() => this.onClickKeyboardShortcutsReload(true)}>
                                    {__("settings.keyboard.resetDefaults")}
                                </button>
                                <button
                                    onClick={() => this.onClickKeyboardShortcutsShow()}>
                                    {__("settings.keyboard.editUserJson")}
                                </button>
                                <button
                                    onClick={() => this.onClickKeyboardShortcutsReload(false)}>
                                        {__("settings.keyboard.loadUserJson")}
                                </button>
                            </div>
                        )}
                        open={this.state.menuOpen}
                        dir="left"
                        toggle={this.openCloseMenu}
                        />
                        )}
                    </section>
                    {this.state.displayKeyboardShortcuts && (
                        <div>
                            <ul className={styles.keyboard_shortcuts_list}>
                            {this.props.keyboardShortcuts &&
                            Object.keys(sortObject(this.props.keyboardShortcuts)).map((id_) => {
                                const id = id_ as TKeyboardShortcutId;
                                const def = this.props.keyboardShortcuts[id];
                                return <li className={
                                    this.state.editKeyboardShortcutId === id ? styles.keyboard_shortcuts_edit_li : null
                                    }
                                    key={`key_${id}`}>
                                    <button
                                        className={styles.keyboard_shortcuts_edit_save_button}
                                        onClick={() => this.onClickKeyboardShortcutEditCancel(id)}>
                                        {this.state.editKeyboardShortcutId === id ?
                                        __("settings.keyboard.cancel") : __("settings.keyboard.edit")}
                                    </button>
                                    {
                                    (this.state.editKeyboardShortcutId === id) &&
                                    <button
                                        className={styles.keyboard_shortcuts_edit_save_button}
                                        onClick={() => this.onClickKeyboardShortcutSave(id)}>
                                        {__("settings.keyboard.save")}
                                    </button>
                                    }

                                    <strong className={
                                        this.state.editKeyboardShortcutId === id ?
                                        styles.keyboard_shortcuts_edit_title
                                        : null
                                        }>{id}</strong>
                                    <div>{
                                        this.state.editKeyboardShortcutId === id ?
                                        this.editifyKeyboardShortcut(id, this.state.editKeyboardShortcutData)
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

    private openCloseMenu() {
        this.setState({ menuOpen: !this.state.menuOpen });
    }
    private onClickKeyboardShortcutSave(id: TKeyboardShortcutId) {

        if (!this.state.editKeyboardShortcutData) {
            return;
        }

        // this.state.editKeyboardShortcutId === id
        const data = this.state.editKeyboardShortcutData;
        this.setState({
            editKeyboardShortcutId: undefined,
            editKeyboardShortcutData: undefined,
        });
        const obj = JSON.parse(JSON.stringify(this.props.keyboardShortcuts)) as TKeyboardShortcutsMap;
        obj[id] = data;
        this.props.setKeyboardShortcuts(obj);
    }
    private onClickKeyboardShortcutEditCancel(id: TKeyboardShortcutId) {

        if (!this.state.editKeyboardShortcutId ||
            this.state.editKeyboardShortcutId !== id) {

            this.setState({
                editKeyboardShortcutId: id,
                editKeyboardShortcutData:
                    JSON.parse(JSON.stringify(this.props.keyboardShortcuts[id])) as TKeyboardShortcut,
            });
            return;
        }

        this.setState({
            editKeyboardShortcutId: undefined,
            editKeyboardShortcutData: undefined,
        });
    }
    private onClickKeyboardShortcutsShowHide() {
        this.setState({
            displayKeyboardShortcuts: !this.state.displayKeyboardShortcuts,

            editKeyboardShortcutId: undefined,
            editKeyboardShortcutData: undefined,
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

        const alt = <><input
            id={`idcheckbox_${id}_ALT`}
            type="checkbox"
            checked={def.alt ? true : false}
            className={styles.hiddenInput}
            onChange={() => {
                const editKeyboardShortcutData =
                    JSON.parse(JSON.stringify(this.state.editKeyboardShortcutData)) as TKeyboardShortcut;
                editKeyboardShortcutData.alt = !editKeyboardShortcutData.alt;
                console.log("editifyKeyboardShortcut ALT:");
                console.log(JSON.stringify(editKeyboardShortcutData, null, 4));
                this.setState({
                    editKeyboardShortcutData,
                });
            }}
        />
        <label
            htmlFor={`idcheckbox_${id}_ALT`}
        >ALT</label></>;

        const shift = <><input
            id={`idcheckbox_${id}_SHIFT`}
            type="checkbox"
            checked={def.shift ? true : false}
            className={styles.hiddenInput}
            onChange={() => {
                const editKeyboardShortcutData =
                    JSON.parse(JSON.stringify(this.state.editKeyboardShortcutData)) as TKeyboardShortcut;
                editKeyboardShortcutData.shift = !editKeyboardShortcutData.shift;
                console.log("editifyKeyboardShortcut SHIFT:");
                console.log(JSON.stringify(editKeyboardShortcutData, null, 4));
                this.setState({
                    editKeyboardShortcutData,
                });
            }}
        />
        <label
            htmlFor={`idcheckbox_${id}_SHIFT`}
        >SHIFT</label></>;

        const control = <><input
            id={`idcheckbox_${id}_CTRL`}
            type="checkbox"
            checked={def.control ? true : false}
            className={styles.hiddenInput}
            onChange={() => {
                const editKeyboardShortcutData =
                    JSON.parse(JSON.stringify(this.state.editKeyboardShortcutData)) as TKeyboardShortcut;
                editKeyboardShortcutData.control = !editKeyboardShortcutData.control;
                console.log("editifyKeyboardShortcut CTRL:");
                console.log(JSON.stringify(editKeyboardShortcutData, null, 4));
                this.setState({
                    editKeyboardShortcutData,
                });
            }}
        />
        <label
            htmlFor={`idcheckbox_${id}_CTRL`}
        >CTRL</label></>;

        const meta = <><input
            id={`idcheckbox_${id}_META`}
            type="checkbox"
            checked={def.meta ? true : false}
            className={styles.hiddenInput}
            onChange={() => {
                const editKeyboardShortcutData =
                    JSON.parse(JSON.stringify(this.state.editKeyboardShortcutData)) as TKeyboardShortcut;
                editKeyboardShortcutData.meta = !editKeyboardShortcutData.meta;
                console.log("editifyKeyboardShortcut META:");
                console.log(JSON.stringify(editKeyboardShortcutData, null, 4));
                this.setState({
                    editKeyboardShortcutData,
                });
            }}
        />
        <label
            htmlFor={`idcheckbox_${id}_META`}
        >META</label></>;

        if (!_keyOptions.includes(def.key)) {
            _keyOptions.push(def.key);
        }

        const keySelect =
        // !this.state.editKeyboardShortcutSelector ?
        // <button
        //     ref={(ref) => {
        //         if (ref && !(ref as any)._WAS_FOCUSED) {
        //             (ref as any)._WAS_FOCUSED = true;
        //             ref.focus();
        //         }
        //     }}
        //     onClick={() => {
        //         this.setState({
        //             editKeyboardShortcutSelector: true,
        //         });
        //     }}
        //     className={styles.keyboard_shortcuts_key}>{def.key}</button> :

        <select
            ref={this.selectRef}
            onChange={(ev) => {
                const editKeyboardShortcutData =
                    JSON.parse(JSON.stringify(this.state.editKeyboardShortcutData)) as TKeyboardShortcut;
                editKeyboardShortcutData.key = ev.target.value.toString();
                console.log("editifyKeyboardShortcut select KEY:");
                console.log(JSON.stringify(editKeyboardShortcutData, null, 4));
                this.setState({
                    editKeyboardShortcutData,
                });
            }}
            onBlur={(ev) => {
                console.log("editifyKeyboardShortcut select BLUR:", ev.target.value.toString());
            }}
            onFocus={(ev) => {
                console.log("editifyKeyboardShortcut select FOCUS:", ev.target.value.toString());
            }}
            value={def.key}
        >
            {_keyOptions.map((keyOption, idx) => {
                return (
                    <option
                        key={`keyOption_${idx}`}
                        value={keyOption}
                    >
                        {keyOption}
                    </option>
                );
            })}
        </select>
        ;
        const keySink = <input className={styles.keyboard_shortcuts_sink} type="text" value="" size={1}
        onChange={(ev) => {
            // console.log("editifyKeyboardShortcut INPUT:", ev.target.value.toString());
            ev.preventDefault();
        }}
        onBlur={() => {
            console.log("editifyKeyboardShortcut sink react BLUR");
        }}
        onFocus={() => {
            console.log("editifyKeyboardShortcut sink react FOCUS");
        }}
        ref={(ref) => {
            if (ref && !(ref as any)._WAS_FOCUSED) {
                (ref as any)._WAS_FOCUSED = true;
                // ref.focus();
                ref.addEventListener("focus", () => {
                    console.log("editifyKeyboardShortcut sink FOCUS");
                    (ref as any)._KEY_SHIFT = undefined;
                    (ref as any)._KEY_CONTROL = undefined;
                    (ref as any)._KEY_META = undefined;
                    (ref as any)._KEY_ALT = undefined;
                });
                ref.addEventListener("blur", () => {
                    console.log("editifyKeyboardShortcut sink BLUR");
                    (ref as any)._KEY_SHIFT = undefined;
                    (ref as any)._KEY_CONTROL = undefined;
                    (ref as any)._KEY_META = undefined;
                    (ref as any)._KEY_ALT = undefined;
                });
                ref.addEventListener("keydown", (ev) => {
                    console.log("editifyKeyboardShortcut sink KEY DOWN:", ev.code);
                    if (!ev.code) {
                        return;
                    }
                    if (ev.code.startsWith("Shift")) {
                        (ref as any)._KEY_SHIFT = true;
                    } else if (ev.code.startsWith("Control")) {
                        (ref as any)._KEY_CONTROL = true;
                    } else if (ev.code.startsWith("Meta")) {
                        (ref as any)._KEY_META = true;
                    } else if (ev.code.startsWith("Alt")) {
                        (ref as any)._KEY_ALT = true;
                    }
                });
                ref.addEventListener("keyup", (ev) => {
                    console.log("editifyKeyboardShortcut sink KEY UP:", ev.code);
                    if (!ev.code) {
                        return;
                    }

                    if (ev.code.startsWith("Shift")) {
                        (ref as any)._KEY_SHIFT = false;
                    } else if (ev.code.startsWith("Control")) {
                        (ref as any)._KEY_CONTROL = false;
                    } else if (ev.code.startsWith("Meta")) {
                        (ref as any)._KEY_META = false;
                    } else if (ev.code.startsWith("Alt")) {
                        (ref as any)._KEY_ALT = false;
                    } else if (!ev.code.startsWith("Tab")) {
                        // if (this.selectRef?.current) {
                        //     this.selectRef.current.value = ev.code;
                        // }

                        const editKeyboardShortcutData =
                            JSON.parse(JSON.stringify(this.state.editKeyboardShortcutData)) as TKeyboardShortcut;
                        editKeyboardShortcutData.key = ev.code;

                        editKeyboardShortcutData.shift = ((ref as any)._KEY_SHIFT ? true : false);
                        editKeyboardShortcutData.control = ((ref as any)._KEY_CONTROL ? true : false);
                        editKeyboardShortcutData.meta = ((ref as any)._KEY_META ? true : false);
                        editKeyboardShortcutData.alt = ((ref as any)._KEY_ALT ? true : false);

                        (ref as any)._KEY_SHIFT = undefined;
                        (ref as any)._KEY_CONTROL = undefined;
                        (ref as any)._KEY_META = undefined;
                        (ref as any)._KEY_ALT = undefined;

                        console.log("editifyKeyboardShortcut sink KEY:");
                        console.log(JSON.stringify(editKeyboardShortcutData, null, 4));
                        this.setState({
                            editKeyboardShortcutData,
                        });
                    }
                });
            }
        }}
        ></input>;
        return <>{shift}{control}{alt}{meta}{keySelect}{keySink}</>;
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
        setKeyboardShortcuts:
            (data: TKeyboardShortcutsMapReadOnly) => dispatch(keyboardActions.setShortcuts.build(data, true)),
        showKeyboardShortcuts: () => dispatch(keyboardActions.showShortcuts.build(true)),
        reloadKeyboardShortcuts: (defaults: boolean) => dispatch(keyboardActions.reloadShortcuts.build(defaults)),
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(LanguageSettings));
