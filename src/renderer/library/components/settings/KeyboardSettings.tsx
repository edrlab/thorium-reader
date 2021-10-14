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
    DEBUG_KEYBOARD, TKeyboardShortcut, TKeyboardShortcutId, TKeyboardShortcutsMap,
    TKeyboardShortcutsMapReadOnly,
} from "readium-desktop/common/keyboard";
import { ToastType } from "readium-desktop/common/models/toast";
import { keyboardActions, toastActions } from "readium-desktop/common/redux/actions/";
import * as MenuIcon from "readium-desktop/renderer/assets/icons/menu.svg";
import * as ChevronDownIcon from "readium-desktop/renderer/assets/icons/chevron-down.svg";
import * as styles from "readium-desktop/renderer/assets/styles/global.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import Menu from "readium-desktop/renderer/common/components/menu/Menu";
import {
    ensureKeyboardListenerIsInstalled, KEY_CODES, TKeyboardDocument,
} from "readium-desktop/renderer/common/keyboard";
import { ILibraryRootState } from "readium-desktop/renderer/library/redux/states";
import { TDispatch } from "readium-desktop/typings/redux";
import { ObjectKeys } from "readium-desktop/utils/object-keys-values";

import { sortObject } from "@r2-utils-js/_utils/JsonUtils";

import SVG from "../../../common/components/SVG";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps>, ReturnType<typeof mapDispatchToProps> {
}

interface IState {
    displayKeyboardShortcuts: boolean;
    editKeyboardShortcutId: TKeyboardShortcutId | undefined;
    editKeyboardShortcutData: TKeyboardShortcut | undefined;
    menuOpen: boolean;
}

class KeyboardSettings extends React.Component<IProps, IState> {

    private selectRef: React.RefObject<HTMLSelectElement>;
    private _keyboardSinkIsActive: boolean;

    constructor(props: IProps) {
        super(props);

        this.state = {
            displayKeyboardShortcuts: false,
            editKeyboardShortcutId: undefined,
            editKeyboardShortcutData: undefined,
            menuOpen: false,
        };
        this.openCloseMenu = this.openCloseMenu.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);

        this.selectRef = React.createRef<HTMLSelectElement>();

        this._keyboardSinkIsActive = false;
    }

    public componentDidMount() {
        ensureKeyboardListenerIsInstalled();

        document.addEventListener("keyup", this.onKeyUp, {
            once: false,
            passive: false,
            capture: true,
        });
    }

    public componentWillUnmount() {
        document.removeEventListener("keyup", this.onKeyUp);
    }

    public render(): React.ReactElement<{}> {
        const { __ } = this.props;
        return (
            <>
            <div className={styles.heading}>
                <h2>{__("settings.keyboard.keyboardShortcuts")}</h2>
            </div>
            <section className={styles.keyboard_shortcuts_section}>
                <button
                    className={
                        classNames(
                            styles.button_primary,
                            styles.button_accordion,
                            this.state.displayKeyboardShortcuts ?
                                styles.keyboard_shortcuts_button_active : null)
                    }
                    onClick={() => this.onClickKeyboardShortcutsShowHide()}
                >
                    <SVG
                        svg={ChevronDownIcon}
                        className={this.state.displayKeyboardShortcuts ? styles.rotate180 : null  }
                    />
                    {this.state.displayKeyboardShortcuts ? __("settings.keyboard.hide") : __("settings.keyboard.show")}
                </button>
                {
                    (
                        this.state.displayKeyboardShortcuts && !this.state.editKeyboardShortcutId
                    ) && (
                        <Menu
                            button={
                                (<SVG
                                    title={
                                        `${__("settings.keyboard.advancedMenu")}`
                                    }
                                    className={styles.button_icon_primary}
                                    svg={MenuIcon}
                                />)
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
                    )
                }
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

    private onKeyUp(ev: KeyboardEvent) {

        if (!this._keyboardSinkIsActive) {
            return;
        }

        if (DEBUG_KEYBOARD) {
            console.log("editifyKeyboardShortcut sink KEY UP:", ev.code);
        }
        if (!ev.code) {
            return;
        }
        // ev.preventDefault();

        if (ev.code.startsWith("Shift")) {
            // noop
        } else if (ev.code.startsWith("Control")) {
            // noop
        } else if (ev.code.startsWith("Meta")) {
            // noop
        } else if (ev.code.startsWith("Alt")) {
            // noop
        } else if (!ev.code.startsWith("Tab")) {
            // if (this.selectRef?.current) {
            //     this.selectRef.current.value = ev.code;
            // }

            const editKeyboardShortcutData =
                JSON.parse(JSON.stringify(this.state.editKeyboardShortcutData || {})) as TKeyboardShortcut;
            editKeyboardShortcutData.key = ev.code;

            const doc = document as TKeyboardDocument;
            editKeyboardShortcutData.shift = doc._keyModifierShift ? true : false;
            editKeyboardShortcutData.control = doc._keyModifierControl ? true : false;
            editKeyboardShortcutData.meta = doc._keyModifierMeta ? true : false;
            editKeyboardShortcutData.alt = doc._keyModifierAlt ? true : false;

            if (DEBUG_KEYBOARD) {
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

        const kstring = this.stringifyKeyboardShortcut(data);
        this.props.toast(
            `${this.props.translator.translate("settings.keyboard.keyboardShortcuts")} ${kstring}`);
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
    private stringifyKeyboardShortcut(def: TKeyboardShortcut) {
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
                if (DEBUG_KEYBOARD) {
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
                if (DEBUG_KEYBOARD) {
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
                if (DEBUG_KEYBOARD) {
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
                if (DEBUG_KEYBOARD) {
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

        if (!KEY_CODES.includes(def.key)) {
            KEY_CODES.push(def.key);
        }

        const keySelect =
        <select
            ref={this.selectRef}
            onChange={(ev) => {
                const editKeyboardShortcutData =
                    JSON.parse(JSON.stringify(this.state.editKeyboardShortcutData)) as TKeyboardShortcut;
                editKeyboardShortcutData.key = ev.target.value.toString();
                if (DEBUG_KEYBOARD) {
                    console.log("editifyKeyboardShortcut select KEY:");
                    console.log(JSON.stringify(editKeyboardShortcutData, null, 4));
                }
                this.setState({
                    editKeyboardShortcutData,
                });
            }}
            onBlur={DEBUG_KEYBOARD ? (ev) => {
                console.log("editifyKeyboardShortcut select BLUR:", ev.target.value.toString());
            } : null}
            onFocus={DEBUG_KEYBOARD ? (ev) => {
                console.log("editifyKeyboardShortcut select FOCUS:", ev.target.value.toString());
            } : null}
            value={def.key}
        >
            {KEY_CODES.map((keyOption, idx) => {
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
        const kstring = this.stringifyKeyboardShortcut(def);
        const keySink = <input
        className={styles.keyboard_shortcuts_sink}
        type="text"
        value=""
        size={1}
        title={kstring}
        onChange={(ev) => {
            // console.log("editifyKeyboardShortcut INPUT:", ev.target.value.toString());
            ev.preventDefault();
        }}
        onBlur={DEBUG_KEYBOARD ? () => {
            console.log("editifyKeyboardShortcut sink react BLUR");
        } : null}
        onFocus={DEBUG_KEYBOARD ? () => {
            console.log("editifyKeyboardShortcut sink react FOCUS");
        } : null}
        ref={(ref) => {
            if (ref && !(ref as any)._KEY_REF) {
                (ref as any)._KEY_REF = true;

                ref.addEventListener("focus", () => {

                    if (DEBUG_KEYBOARD) {
                        console.log("editifyKeyboardShortcut sink FOCUS");
                    }
                    this._keyboardSinkIsActive = true;
                });
                ref.addEventListener("blur", () => {

                    if (DEBUG_KEYBOARD) {
                        console.log("editifyKeyboardShortcut sink BLUR");
                    }
                    this._keyboardSinkIsActive = false;
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
        locale: state.i18n.locale,
    };
};

const mapDispatchToProps = (dispatch: TDispatch, _props: IBaseProps) => {
    return {
        setKeyboardShortcuts:
            (data: TKeyboardShortcutsMapReadOnly) => dispatch(keyboardActions.setShortcuts.build(data, true)),
        showKeyboardShortcuts: () => dispatch(keyboardActions.showShortcuts.build(true)),
        reloadKeyboardShortcuts: (defaults: boolean) => dispatch(keyboardActions.reloadShortcuts.build(defaults)),
        toast: (str: string) => dispatch(toastActions.openRequest.build(ToastType.Success, str)),
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(KeyboardSettings));
