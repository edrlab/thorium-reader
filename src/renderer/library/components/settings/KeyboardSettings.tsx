// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import classNames from "classnames";
import * as React from "react";
import FocusLock from "react-focus-lock";
import { connect } from "react-redux";
import {
    TKeyboardShortcut, TKeyboardShortcutId, TKeyboardShortcutsMap, TKeyboardShortcutsMapReadOnly,
} from "readium-desktop/common/keyboard";
import { keyboardActions } from "readium-desktop/common/redux/actions/";
import * as MenuIcon from "readium-desktop/renderer/assets/icons/menu.svg";
import * as styles from "readium-desktop/renderer/assets/styles/settings.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import Menu from "readium-desktop/renderer/common/components/menu/Menu";
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

const _DEBUG_KEYS = false;

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

class KeyboardSettings extends React.Component<IProps, IState> {

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

    public componentDidMount() {

        if ((document as any)._KEY_DOCUMENT_LISTEN) {
            return;
        }
        (document as any)._KEY_DOCUMENT_LISTEN = true;

        document.addEventListener("keydown", (ev) => {
            if (!(document as any)._KEY_SINK_LISTEN) {
                return;
            }
            if (_DEBUG_KEYS) {
                console.log("editifyKeyboardShortcut sink KEY DOWN:", ev.code);
            }

            if (!ev.code) {
                return;
            }
            // ev.preventDefault();

            if (ev.code.startsWith("Shift")) {
                (document as any)._KEY_SHIFT = true;
            } else if (ev.code.startsWith("Control")) {
                (document as any)._KEY_CONTROL = true;
            } else if (ev.code.startsWith("Meta")) {
                (document as any)._KEY_META = true;
            } else if (ev.code.startsWith("Alt")) {
                (document as any)._KEY_ALT = true;
            }
        }, {
            once: false,
            passive: false,
            capture: true,
        });
        document.addEventListener("keyup", (ev) => {
            if (!(document as any)._KEY_SINK_LISTEN) {
                return;
            }
            if (_DEBUG_KEYS) {
                console.log("editifyKeyboardShortcut sink KEY UP:", ev.code);
            }
            if (!ev.code) {
                return;
            }
            // ev.preventDefault();

            if (ev.code.startsWith("Shift")) {
                (document as any)._KEY_SHIFT = false;
            } else if (ev.code.startsWith("Control")) {
                (document as any)._KEY_CONTROL = false;
            } else if (ev.code.startsWith("Meta")) {
                (document as any)._KEY_META = false;
            } else if (ev.code.startsWith("Alt")) {
                (document as any)._KEY_ALT = false;
            } else if (!ev.code.startsWith("Tab")) {
                // if (this.selectRef?.current) {
                //     this.selectRef.current.value = ev.code;
                // }

                const editKeyboardShortcutData =
                    JSON.parse(JSON.stringify(this.state.editKeyboardShortcutData)) as TKeyboardShortcut;
                editKeyboardShortcutData.key = ev.code;

                editKeyboardShortcutData.shift = (document as any)._KEY_SHIFT ? true : false;
                editKeyboardShortcutData.control = (document as any)._KEY_CONTROL ? true : false;
                editKeyboardShortcutData.meta = (document as any)._KEY_META ? true : false;
                editKeyboardShortcutData.alt = (document as any)._KEY_ALT ? true : false;

                if (_DEBUG_KEYS) {
                    if (editKeyboardShortcutData.shift !== ev.shiftKey) {
                        console.log("editifyKeyboardShortcut sink SHIFT differs?");
                    }
                    if (editKeyboardShortcutData.control !== ev.ctrlKey) {
                        console.log("editifyKeyboardShortcut sink CONTROL differs?");
                    }
                    if (editKeyboardShortcutData.meta !== ev.metaKey) {
                        console.log("editifyKeyboardShortcut sink META differs?");
                    }
                    if (editKeyboardShortcutData.alt !== ev.altKey) {
                        console.log("editifyKeyboardShortcut sink ALT differs?");
                    }

                    console.log("editifyKeyboardShortcut sink KEY:");
                    console.log(JSON.stringify(editKeyboardShortcutData, null, 4));
                }

                this.setState({
                    editKeyboardShortcutData,
                });
            }
        }, {
            once: false,
            passive: false,
            capture: true,
        });
    }

    public render(): React.ReactElement<{}> {
        const { __ } = this.props;
        return (
            <>
            <h3>{ __("settings.keyboard.keyboardShortcuts")}</h3>
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
                    ObjectKeys(sortObject(this.props.keyboardShortcuts) as TKeyboardShortcutsMap).map((id) => {
                        const def = this.props.keyboardShortcuts[id];
                        const hit = this.state.editKeyboardShortcutId === id;
                        const frag = <>
                            <button
                                className={styles.keyboard_shortcuts_edit_save_button}
                                onClick={() => this.onClickKeyboardShortcutEditCancel(id)}>
                                {hit ?
                                __("settings.keyboard.cancel") : __("settings.keyboard.edit")}
                            </button>
                            {
                            hit &&
                            <button
                                className={styles.keyboard_shortcuts_edit_save_button}
                                onClick={() => this.onClickKeyboardShortcutSave(id)}>
                                {__("settings.keyboard.save")}
                            </button>
                            }

                            <strong className={
                                hit ?
                                styles.keyboard_shortcuts_edit_title
                                : null
                                }>{id}</strong>
                            <div className={styles.keyboard_shortcuts_buttons_container}>{
                                hit ?
                                this.editifyKeyboardShortcut(id, this.state.editKeyboardShortcutData)
                                :
                                this.prettifyKeyboardShortcut(def)
                            }</div>
                        </>;
                        return <li className={
                            hit ? styles.keyboard_shortcuts_edit_li : null
                            }
                            key={`key_${id}`}>{
                            (hit ? <FocusLock
                                disabled={false}
                                autoFocus={false}>{frag}</FocusLock> : frag)
                            }
                        </li>;
                    })}
                    </ul>
                </div>
            )}
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
        const alt = def.alt ? <span className={styles.keyboard_shortcuts_key}>ALT</span> : null;
        const shift = def.shift ? <span className={styles.keyboard_shortcuts_key}>SHIFT</span> : null;
        const control = def.control ? <span className={styles.keyboard_shortcuts_key}>CTRL</span> : null;
        const meta = def.meta ? <span className={styles.keyboard_shortcuts_key}>META</span> : null;
        const key = <span className={styles.keyboard_shortcuts_key}>{def.key}</span>;
        return <>{shift}{control}{alt}{meta}{(def.shift || def.control || def.alt || def.meta) ?
            (<span className={styles.keyboard_shortcuts_separator}>+</span>) :
            null}{key}</>;
    }
    private stringifyKeyboardShortcut(_id: TKeyboardShortcutId, def: TKeyboardShortcut) {
        return `${def.shift ? "SHIFT " : ""}${def.control ? "CTRL " : ""}${def.alt ? "ALT " : ""}${def.meta ? "META " : ""}${(def.shift || def.control || def.alt || def.meta) ? "+ " : ""}${def.key}`;
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
                if (_DEBUG_KEYS) {
                    console.log("editifyKeyboardShortcut ALT:");
                    console.log(JSON.stringify(editKeyboardShortcutData, null, 4));
                }
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
                if (_DEBUG_KEYS) {
                    console.log("editifyKeyboardShortcut SHIFT:");
                    console.log(JSON.stringify(editKeyboardShortcutData, null, 4));
                }
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
                if (_DEBUG_KEYS) {
                    console.log("editifyKeyboardShortcut CTRL:");
                    console.log(JSON.stringify(editKeyboardShortcutData, null, 4));
                }
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
                if (_DEBUG_KEYS) {
                    console.log("editifyKeyboardShortcut META:");
                    console.log(JSON.stringify(editKeyboardShortcutData, null, 4));
                }
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
        <select
            ref={this.selectRef}
            onChange={(ev) => {
                const editKeyboardShortcutData =
                    JSON.parse(JSON.stringify(this.state.editKeyboardShortcutData)) as TKeyboardShortcut;
                editKeyboardShortcutData.key = ev.target.value.toString();
                if (_DEBUG_KEYS) {
                    console.log("editifyKeyboardShortcut select KEY:");
                    console.log(JSON.stringify(editKeyboardShortcutData, null, 4));
                }
                this.setState({
                    editKeyboardShortcutData,
                });
            }}
            onBlur={_DEBUG_KEYS ? (ev) => {
                console.log("editifyKeyboardShortcut select BLUR:", ev.target.value.toString());
            } : null}
            onFocus={_DEBUG_KEYS ? (ev) => {
                console.log("editifyKeyboardShortcut select FOCUS:", ev.target.value.toString());
            } : null}
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
        const keySink = <input
        className={styles.keyboard_shortcuts_sink}
        type="text"
        value=""
        size={1}
        title={this.stringifyKeyboardShortcut(id, def)}
        onChange={(ev) => {
            // console.log("editifyKeyboardShortcut INPUT:", ev.target.value.toString());
            ev.preventDefault();
        }}
        onBlur={_DEBUG_KEYS ? () => {
            console.log("editifyKeyboardShortcut sink react BLUR");
        } : null}
        onFocus={_DEBUG_KEYS ? () => {
            console.log("editifyKeyboardShortcut sink react FOCUS");
        } : null}
        ref={(ref) => {
            if (ref && !(ref as any)._KEY_REF) {
                (ref as any)._KEY_REF = true;

                ref.addEventListener("focus", () => {
                    if (_DEBUG_KEYS) {
                        console.log("editifyKeyboardShortcut sink FOCUS");
                    }
                    (document as any)._KEY_SINK_LISTEN = true;

                    (document as any)._KEY_SHIFT = undefined;
                    (document as any)._KEY_CONTROL = undefined;
                    (document as any)._KEY_META = undefined;
                    (document as any)._KEY_ALT = undefined;
                });
                ref.addEventListener("blur", () => {
                    if (_DEBUG_KEYS) {
                        console.log("editifyKeyboardShortcut sink BLUR");
                    }
                    (document as any)._KEY_SINK_LISTEN = false;

                    (document as any)._KEY_SHIFT = undefined;
                    (document as any)._KEY_CONTROL = undefined;
                    (document as any)._KEY_META = undefined;
                    (document as any)._KEY_ALT = undefined;
                });
            }
        }}
        ></input>;
        return <>{shift}{control}{alt}{meta}{keySelect}{keySink}</>;
    }
}

const mapStateToProps = (state: ILibraryRootState, _props: IBaseProps) => {
    return {
        keyboardShortcuts: state.keyboard.shortcuts,
    };
};

const mapDispatchToProps = (dispatch: TDispatch, _props: IBaseProps) => {
    return {
        setKeyboardShortcuts:
            (data: TKeyboardShortcutsMapReadOnly) => dispatch(keyboardActions.setShortcuts.build(data, true)),
        showKeyboardShortcuts: () => dispatch(keyboardActions.showShortcuts.build(true)),
        reloadKeyboardShortcuts: (defaults: boolean) => dispatch(keyboardActions.reloadShortcuts.build(defaults)),
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(KeyboardSettings));
