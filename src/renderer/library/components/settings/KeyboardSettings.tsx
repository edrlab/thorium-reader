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
import * as ChevronDownIcon from "readium-desktop/renderer/assets/icons/chevron-down.svg";
import * as MenuIcon from "readium-desktop/renderer/assets/icons/menu.svg";
import * as stylesBlocks from "readium-desktop/renderer/assets/styles/components/blocks.css";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.css";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.css";
import * as stylesInputs from "readium-desktop/renderer/assets/styles/components/inputs.css";
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
        };
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
                <section>
                    <div className={stylesGlobal.heading}>
                        <h2>{__("settings.keyboard.keyboardShortcuts")}</h2>
                    </div>
                    <div className={classNames(stylesGlobal.d_flex, stylesButtons.button_outline_accessibility)}>
                        <button
                            className={stylesButtons.button_primary}
                            onClick={() => this.onClickKeyboardShortcutsShowHide()}
                        >
                            <SVG
                                ariaHidden={true}
                                svg={ChevronDownIcon}
                                className={this.state.displayKeyboardShortcuts ? stylesGlobal.rotate180 : null}
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
                                            className={stylesButtons.button_primary_icon}
                                            svg={MenuIcon}
                                        />)
                                    }
                                >
                                    <button onClick={() => this.onClickKeyboardShortcutsReload(true)}>
                                        {__("settings.keyboard.resetDefaults")}
                                    </button>
                                    <button onClick={() => this.onClickKeyboardShortcutsShow()}>
                                        {__("settings.keyboard.editUserJson")}
                                    </button>
                                    <button onClick={() => this.onClickKeyboardShortcutsReload(false)}>
                                        {__("settings.keyboard.loadUserJson")}
                                    </button>
                                </Menu>
                            )
                        }
                    </div>
                    {this.state.displayKeyboardShortcuts && (
                        <div
                            onKeyUp={this.state.editKeyboardShortcutId ? ((e: React.KeyboardEvent<HTMLDivElement>) => {
                                if (e.key === "Escape") {
                                    const id = this.state.editKeyboardShortcutId;
                                    this.onClickKeyboardShortcutEditCancel(this.state.editKeyboardShortcutId);
                                    setTimeout(() => {
                                        const el = document.getElementById(`keyEditButt_${id}`);
                                        el?.blur();
                                        el?.focus();
                                    }, 100);
                                }
                            }) : undefined}>
                            <ul className={stylesGlobal.p_0}>
                            {this.props.keyboardShortcuts &&
                            ObjectKeys(sortObject(this.props.keyboardShortcuts) as TKeyboardShortcutsMap).map((id) => {
                                const def = this.props.keyboardShortcuts[id];
                                const hit = this.state.editKeyboardShortcutId === id;
                                const frag = <>
                                    <button
                                        id={`keyEditButt_${id}`}
                                        className={stylesButtons.button_primary_small}
                                        onClick={(_ev) => {
                                            const id_ = id;
                                            this.onClickKeyboardShortcutEditCancel(id);
                                            // const el = ev.currentTarget;
                                            setTimeout(() => {
                                                const el = document.getElementById(`keyEditButt_${id_}`);
                                                el?.blur();
                                                el?.focus();
                                            }, 100);
                                        }}
                                        aria-label={`${hit ? __("settings.keyboard.cancel") : __("settings.keyboard.edit")} (${id}) ${this.stringifyKeyboardShortcut(def)}`}
                                        >
                                        {hit ?
                                        __("settings.keyboard.cancel") : __("settings.keyboard.edit")}
                                    </button>
                                    {
                                    hit &&
                                    <button
                                        className={stylesButtons.button_primary_small}
                                        onClick={(_ev) => {
                                            const id_ = id;
                                            this.onClickKeyboardShortcutSave(id);
                                            setTimeout(() => {
                                                const el = document.getElementById(`keyEditButt_${id_}`);
                                                el?.blur();
                                                el?.focus();
                                            }, 100);
                                        }}
                                        aria-label={`${__("settings.keyboard.save")} (${id})`}
                                        >
                                        {__("settings.keyboard.save")}
                                    </button>
                                    }

                                    <strong aria-hidden>{id}</strong>
                                    <div aria-hidden className={stylesGlobal.text_right}>{
                                        hit ?
                                        this.editifyKeyboardShortcut(id, this.state.editKeyboardShortcutData)
                                        :
                                        this.prettifyKeyboardShortcut(def)
                                    }</div>
                                </>;
                                return <li
                                        aria-hidden={!this.state.editKeyboardShortcutId || hit ? undefined : true}
                                        className={
                                            hit ?
                                                classNames(stylesBlocks.block_line_edit, stylesGlobal.no_list_style)
                                            :
                                            this.state.editKeyboardShortcutId ?
                                            classNames(stylesBlocks.block_line_inactive, stylesBlocks.block_line, stylesGlobal.no_list_style)
                                            :
                                            classNames(stylesBlocks.block_line, stylesGlobal.no_list_style)
                                        }
                                    key={`key_${id}`}>{
                                    (hit ? <FocusLock
                                        disabled={false}
                                        autoFocus={true}>{frag}</FocusLock> : frag)
                                    }
                                </li>;
                            })}
                            </ul>
                        </div>
                    )}
                </section>
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

        // const kstring = this.stringifyKeyboardShortcut(data);
        // this.props.toast(
        //     `${this.props.translator.translate("settings.keyboard.keyboardShortcuts")} ${kstring}`);
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
        const alt = def.alt ? <span className={stylesButtons.button_keyboard}>ALT</span> : null;
        const shift = def.shift ? <span className={stylesButtons.button_keyboard}>SHIFT</span> : null;
        const control = def.control ? <span className={stylesButtons.button_keyboard}>CTRL</span> : null;
        const meta = def.meta ? <span className={stylesButtons.button_keyboard}>META</span> : null;
        const key = <span className={stylesButtons.button_keyboard}>{def.key}</span>;
        return <>{shift}{control}{alt}{meta}{(def.shift || def.control || def.alt || def.meta) ?
            (<span className={classNames(stylesGlobal.fw_bold, stylesGlobal.mr_10)}>+</span>) :
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
            className={stylesInputs.checkbox_keyboard}
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
            className={stylesInputs.checkbox_keyboard}
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
            className={stylesInputs.checkbox_keyboard}
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
            className={stylesInputs.checkbox_keyboard}
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
            className={stylesButtons.button_keyboard}
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
        className={stylesInputs.outline}
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
