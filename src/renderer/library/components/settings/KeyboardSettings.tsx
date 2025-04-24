// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesBlocks from "readium-desktop/renderer/assets/styles/components/blocks.scss";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.scss";
import * as stylesInputs from "readium-desktop/renderer/assets/styles/components/inputs.scss";
import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";
import * as stylesKeys from "readium-desktop/renderer/assets/styles/components/keyboardsShortcuts.scss";
import * as stylesDropDown from "readium-desktop/renderer/assets/styles/components/dropdown.scss";

import classNames from "classnames";
import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import {Button, OverlayArrow, Tooltip, TooltipTrigger} from "react-aria-components";
import FocusLock from "react-focus-lock";
import { connect } from "react-redux";
import {
    DEBUG_KEYBOARD, TKeyboardShortcut, TKeyboardShortcutId, TKeyboardShortcutsMap,
    TKeyboardShortcutsMapReadOnly,
} from "readium-desktop/common/keyboard";
import { ToastType } from "readium-desktop/common/models/toast";
import { keyboardActions, toastActions } from "readium-desktop/common/redux/actions/";
import * as MenuIcon from "readium-desktop/renderer/assets/icons/menu.svg";
import * as InfoIcon from "readium-desktop/renderer/assets/icons/info-icon.svg";

import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import {
    ensureKeyboardListenerIsInstalled, KEY_CODES, TKeyboardDocument,
} from "readium-desktop/renderer/common/keyboard";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import { TDispatch } from "readium-desktop/typings/redux";
import { ObjectKeys } from "readium-desktop/utils/object-keys-values";

import { sortObject } from "@r2-utils-js/_utils/JsonUtils";

import SVG from "../../../common/components/SVG";
import * as EditIcon from "readium-desktop/renderer/assets/icons/pen-icon.svg";
import * as SaveIcon from "readium-desktop/renderer/assets/icons/floppydisk-icon.svg";
import * as ShiftIcon from "readium-desktop/renderer/assets/icons/shift-icon.svg";
import * as MacOptionIcon from "readium-desktop/renderer/assets/icons/macoption-icon.svg";
import * as MacCmdIcon from "readium-desktop/renderer/assets/icons/maccommand-icon.svg";
import { useTranslator } from "../../../common/hooks/useTranslator";
import { useDispatch } from "../../../common/hooks/useDispatch";
import os from "node:os"; 

const _isMac = os.platform() === "darwin";
const _isWindows = os.platform() === "win32";
// const isLinux = !isMac && !isWindows;
const DETECTED_OS: "Windows" | "MacOS" | "Linux" = _isWindows ? "Windows" : _isMac ? "MacOS" : "Linux";

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
    searchItem: string | undefined;
}

export const AdvancedTrigger = () => {
    const [ __ ]= useTranslator();
    const dispatch = useDispatch();

    const onClickKeyboardShortcutsShow = () => {
        dispatch(keyboardActions.showShortcuts.build(true));
    };

    const onClickKeyboardShortcutsReload = (defaults: boolean) => {
        dispatch(keyboardActions.reloadShortcuts.build(defaults));
    };

    return (
        <Popover.Root>
            <Popover.Trigger asChild>
                <button>
                    <SVG
                        title={
                            `${__("settings.keyboard.advancedMenu")}`
                        }
                        className={classNames(stylesButtons.button_secondary_blue, stylesKeys.advanced_trigger)}
                        svg={MenuIcon}
                    />
                </button>
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Content sideOffset={5} className={stylesDropDown.PopoverContent}>
                    <div className={stylesDropDown.dropdown_menu}>
                        <button onClick={() => onClickKeyboardShortcutsReload(true)}>
                            {__("settings.keyboard.resetDefaults")}
                        </button>
                        <button onClick={() => onClickKeyboardShortcutsShow()}>
                            {__("settings.keyboard.editUserJson")}
                        </button>
                        <button onClick={() => onClickKeyboardShortcutsReload(false)}>
                            {__("settings.keyboard.loadUserJson")}
                        </button>
                    </div>
                    <Popover.Arrow className={stylesDropDown.PopoverArrow} aria-hidden />
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
};


class KeyboardSettings extends React.Component<IProps, IState> {

    private selectRef: React.RefObject<HTMLSelectElement>;
    private _keyboardSinkIsActive: boolean;

    constructor(props: IProps) {
        super(props);

        this.state = {
            displayKeyboardShortcuts: false,
            editKeyboardShortcutId: undefined,
            editKeyboardShortcutData: undefined,
            searchItem: undefined,
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

        const isSearchEmpty = !this.state.searchItem || this.state.searchItem.trim() === "";

        const cleanNames = {
            AddBookmarkWithLabel: {
                name: `${__("settings.keyboard.list.AddBookmarkWithLabel.name")}`,
                description: `${__("settings.keyboard.list.AddBookmarkWithLabel.description")}`,
            },
            AnnotationsCreate: {
                name: `${__("settings.keyboard.list.AnnotationsCreate.name")}`,
                description: `${__("settings.keyboard.list.AnnotationsCreate.description")}`,
            },
            AnnotationsCreateQuick: {
                name: `${__("settings.keyboard.list.AnnotationsCreateQuick.name")}`,
                description: `${__("settings.keyboard.list.AnnotationsCreateQuick.description")}`,
            },
            AnnotationsToggleMargin: {
                name: `${__("settings.keyboard.list.AnnotationsToggleMargin.name")}`,
                description: `${__("settings.keyboard.list.AnnotationsToggleMargin.description")}`,
            },
            AudioNext: {
                name: `${__("settings.keyboard.list.AudioNext.name")}`,
                description: `${__("settings.keyboard.list.AudioNext.description")}`,
            },
            AudioNextAlt: {
                name: `${__("settings.keyboard.list.AudioNextAlt.name")}`,
                description: `${__("settings.keyboard.list.AudioNextAlt.description")}`,
            },
            AudioPlayPause: {
                name: `${__("settings.keyboard.list.AudioPlayPause.name")}`,
                description: `${__("settings.keyboard.list.AudioPlayPause.description")}`,
            },
            AudioPrevious: {
                name: `${__("settings.keyboard.list.AudioPrevious.name")}`,
                description: `${__("settings.keyboard.list.AudioPrevious.description")}`,
            },
            AudioPreviousAlt: {
                name: `${__("settings.keyboard.list.AudioPreviousAlt.name")}`,
                description: `${__("settings.keyboard.list.AudioPreviousAlt.description")}`,
            },
            AudioStop: {
                name: `${__("settings.keyboard.list.AudioStop.name")}`,
                description: `${__("settings.keyboard.list.AudioStop.description")}`,
            },
            CloseReader: {
                name: `${__("settings.keyboard.list.CloseReader.name")}`,
                description: `${__("settings.keyboard.list.CloseReader.description")}`,
            },
            FXLZoomIn: {
                name: `${__("settings.keyboard.list.FXLZoomIn.name")}`,
                description: `${__("settings.keyboard.list.FXLZoomIn.description")}`,
            },
            FXLZoomOut: {
                name: `${__("settings.keyboard.list.FXLZoomOut.name")}`,
                description: `${__("settings.keyboard.list.FXLZoomOut.description")}`,
            },
            FXLZoomReset: {
                name: `${__("settings.keyboard.list.FXLZoomReset.name")}`,
                description: `${__("settings.keyboard.list.FXLZoomReset.description")}`,
            },
            FocusMain: {
                name: `${__("settings.keyboard.list.FocusMain.name")}`,
                description: `${__("settings.keyboard.list.FocusMain.description")}`,
            },
            FocusMainDeep: {
                name: `${__("settings.keyboard.list.FocusMainDeep.name")}`,
                description: `${__("settings.keyboard.list.FocusMainDeep.description")}`,
            },
            FocusReaderGotoPage: {
                name: `${__("settings.keyboard.list.FocusReaderGotoPage.name")}`,
                description: `${__("settings.keyboard.list.FocusReaderGotoPage.description")}`,
            },
            FocusReaderNavigation: {
                name: `${__("settings.keyboard.list.FocusReaderNavigation.name")}`,
                description: `${__("settings.keyboard.list.FocusReaderNavigation.description")}`,
            },
            FocusReaderNavigationAnnotations: {
                name: `${__("settings.keyboard.list.FocusReaderNavigationAnnotations.name")}`,
                description: `${__("settings.keyboard.list.FocusReaderNavigationAnnotations.description")}`,
            },
            FocusReaderNavigationBookmarks: {
                name: `${__("settings.keyboard.list.FocusReaderNavigationBookmarks.name")}`,
                description: `${__("settings.keyboard.list.FocusReaderNavigationBookmarks.description")}`,
            },
            FocusReaderNavigationSearch: {
                name: `${__("settings.keyboard.list.FocusReaderNavigationSearch.name")}`,
                description: `${__("settings.keyboard.list.FocusReaderNavigationSearch.description")}`,
            },
            FocusReaderNavigationTOC: {
                name: `${__("settings.keyboard.list.FocusReaderNavigationTOC.name")}`,
                description: `${__("settings.keyboard.list.FocusReaderNavigationTOC.description")}`,
            },
            FocusReaderSettings: {
                name: `${__("settings.keyboard.list.FocusReaderSettings.name")}`,
                description: `${__("settings.keyboard.list.FocusReaderSettings.description")}`,
            },
            FocusSearch: {
                name: `${__("settings.keyboard.list.FocusSearch.name")}`,
                description: `${__("settings.keyboard.list.FocusSearch.description")}`,
            },
            FocusToolbar: {
                name: `${__("settings.keyboard.list.FocusToolbar.name")}`,
                description: `${__("settings.keyboard.list.FocusToolbar.description")}`,
            },
            NavigateNextChapter: {
                name: `${__("settings.keyboard.list.NavigateNextChapter.name")}`,
                description: `${__("settings.keyboard.list.NavigateNextChapter.description")}`,
            },
            NavigateNextChapterAlt: {
                name: `${__("settings.keyboard.list.NavigateNextChapterAlt.name")}`,
                description: `${__("settings.keyboard.list.NavigateNextChapterAlt.description")}`,
            },
            NavigateNextHistory: {
                name: `${__("settings.keyboard.list.NavigateNextHistory.name")}`,
                description: `${__("settings.keyboard.list.NavigateNextHistory.description")}`,
            },
            NavigateNextLibraryPage: {
                name: `${__("settings.keyboard.list.NavigateNextLibraryPage.name")}`,
                description: `${__("settings.keyboard.list.NavigateNextLibraryPage.description")}`,
            },
            NavigateNextLibraryPageAlt: {
                name: `${__("settings.keyboard.list.NavigateNextLibraryPageAlt.name")}`,
                description: `${__("settings.keyboard.list.NavigateNextLibraryPageAlt.description")}`,
            },
            NavigateNextOPDSPage: {
                name: `${__("settings.keyboard.list.NavigateNextOPDSPage.name")}`,
                description: `${__("settings.keyboard.list.NavigateNextOPDSPage.description")}`,
            },
            NavigateNextOPDSPageAlt: {
                name: `${__("settings.keyboard.list.NavigateNextOPDSPageAlt.name")}`,
                description: `${__("settings.keyboard.list.NavigateNextOPDSPageAlt.description")}`,
            },
            NavigateNextPage: {
                name: `${__("settings.keyboard.list.NavigateNextPage.name")}`,
                description: `${__("settings.keyboard.list.NavigateNextPage.description")}`,
            },
            NavigateNextPageAlt: {
                name: `${__("settings.keyboard.list.NavigateNextPageAlt.name")}`,
                description: `${__("settings.keyboard.list.NavigateNextPageAlt.description")}`,
            },
            NavigatePreviousChapter: {
                name: `${__("settings.keyboard.list.NavigatePreviousChapter.name")}`,
                description: `${__("settings.keyboard.list.NavigatePreviousChapter.description")}`,
            },
            NavigatePreviousChapterAlt: {
                name: `${__("settings.keyboard.list.NavigatePreviousChapterAlt.name")}`,
                description: `${__("settings.keyboard.list.NavigatePreviousChapterAlt.description")}`,
            },
            NavigatePreviousHistory: {
                name: `${__("settings.keyboard.list.NavigatePreviousHistory.name")}`,
                description: `${__("settings.keyboard.list.NavigatePreviousHistory.description")}`,
            },
            NavigatePreviousLibraryPage: {
                name: `${__("settings.keyboard.list.NavigatePreviousLibraryPage.name")}`,
                description: `${__("settings.keyboard.list.NavigatePreviousLibraryPage.description")}`,
            },
            NavigatePreviousLibraryPageAlt: {
                name: `${__("settings.keyboard.list.NavigatePreviousLibraryPageAlt.name")}`,
                description: `${__("settings.keyboard.list.NavigatePreviousLibraryPageAlt.description")}`,
            },
            NavigatePreviousOPDSPage: {
                name: `${__("settings.keyboard.list.NavigatePreviousOPDSPage.name")}`,
                description: `${__("settings.keyboard.list.NavigatePreviousOPDSPage.description")}`,
            },
            NavigatePreviousOPDSPageAlt: {
                name: `${__("settings.keyboard.list.NavigatePreviousOPDSPageAlt.name")}`,
                description: `${__("settings.keyboard.list.NavigatePreviousOPDSPageAlt.description")}`,
            },
            NavigatePreviousPage: {
                name: `${__("settings.keyboard.list.NavigatePreviousPage.name")}`,
                description: `${__("settings.keyboard.list.NavigatePreviousPage.description")}`,
            },
            NavigatePreviousPageAlt: {
                name: `${__("settings.keyboard.list.NavigatePreviousPageAlt.name")}`,
                description: `${__("settings.keyboard.list.NavigatePreviousPageAlt.description")}`,
            },
            NavigateToBegin: {
                name: `${__("settings.keyboard.list.NavigateToBegin.name")}`,
                description: `${__("settings.keyboard.list.NavigateToBegin.description")}`,
            },
            NavigateToEnd: {
                name: `${__("settings.keyboard.list.NavigateToEnd.name")}`,
                description: `${__("settings.keyboard.list.NavigateToEnd.description")}`,
            },
            OpenReaderInfo: {
                name: `${__("settings.keyboard.list.OpenReaderInfo.name")}`,
                description: `${__("settings.keyboard.list.OpenReaderInfo.description")}`,
            },
            OpenReaderInfoWhereAmI: {
                name: `${__("settings.keyboard.list.OpenReaderInfoWhereAmI.name")}`,
                description: `${__("settings.keyboard.list.OpenReaderInfoWhereAmI.description")}`,
            },
            SearchNext: {
                name: `${__("settings.keyboard.list.SearchNext.name")}`,
                description: `${__("settings.keyboard.list.SearchNext.description")}`,
            },
            SearchNextAlt: {
                name: `${__("settings.keyboard.list.SearchNextAlt.name")}`,
                description: `${__("settings.keyboard.list.SearchNextAlt.description")}`,
            },
            SearchPrevious: {
                name: `${__("settings.keyboard.list.SearchPrevious.name")}`,
                description: `${__("settings.keyboard.list.SearchPrevious.description")}`,
            },
            SearchPreviousAlt: {
                name: `${__("settings.keyboard.list.SearchPreviousAlt.name")}`,
                description: `${__("settings.keyboard.list.SearchPreviousAlt.description")}`,
            },
            SpeakReaderInfoWhereAmI: {
                name: `${__("settings.keyboard.list.SpeakReaderInfoWhereAmI.name")}`,
                description: `${__("settings.keyboard.list.SpeakReaderInfoWhereAmI.description")}`,
            },
            ToggleBookmark: {
                name: `${__("settings.keyboard.list.ToggleBookmark.name")}`,
                description: `${__("settings.keyboard.list.ToggleBookmark.description")}`,
            },
            ToggleReaderFullscreen: {
                name: `${__("settings.keyboard.list.ToggleReaderFullscreen.name")}`,
                description: `${__("settings.keyboard.list.ToggleReaderFullscreen.description")}`,
            },              
        };
        

        const filteredShortcuts = isSearchEmpty
        ? ObjectKeys(sortObject(this.props.keyboardShortcuts) as TKeyboardShortcutsMap)
        : ObjectKeys(cleanNames).filter(key => cleanNames[key].name.toLowerCase().includes(this.state.searchItem?.toLowerCase()));
          
        return (
            <>
                <section onKeyDown={
                    this.state.editKeyboardShortcutId ? ((e: React.KeyboardEvent<HTMLDivElement>) => {
                        if (e.key === "Escape") {
                            e.preventDefault();
                            e.stopPropagation();
                            const id = this.state.editKeyboardShortcutId;
                            this.onClickKeyboardShortcutEditCancel(this.state.editKeyboardShortcutId);
                            setTimeout(() => {
                                const el = document.getElementById(`keyEditButt_${id}`);
                                el?.blur();
                                el?.focus();
                            }, 100);
                        }
                    }) : undefined}>
                    <div className={classNames(stylesGlobal.d_flex, stylesButtons.button_outline_accessibility)}>
                    {/* {!this.state.editKeyboardShortcutId && (
                        <AdvancedTrigger
                        showKeyboardShortcuts={this.props.showKeyboardShortcuts}
                        reloadKeyboardShortcuts={this.props.reloadKeyboardShortcuts}
                        />
                            )
                        } */}
                        <div className={stylesSettings.session_text}>
                            <SVG ariaHidden svg={InfoIcon} />
                            <p>{__("settings.keyboard.disclaimer")}</p>
                        </div>
                    </div>
                        <div>
                        <input
                            type="text"
                            value={this.state.searchItem}
                            onChange={(e) => this.setState({searchItem: e.target.value})}
                            placeholder={__("settings.keyboard.searchPlaceholder")}
                            style={{width: "200px", borderRadius: "4px"}}
                        />
                        {filteredShortcuts.length ?
                            <ul className={stylesGlobal.p_0}>
                            {this.props.keyboardShortcuts &&
                            filteredShortcuts.map((id) => {
                                const def = this.props.keyboardShortcuts[id];
                                const hit = this.state.editKeyboardShortcutId === id;
                                const frag = <>
                                    <div style={{display: "flex"}}>
                                        <h3 aria-hidden className={stylesKeys.keyshortElement_title}>{Object.keys(cleanNames).find((name: string) => name === id) ? cleanNames[id].name : undefined}</h3>
                                    {    cleanNames[id].description.length ?                                    
                                        <TooltipTrigger>
                                            <Button style={{width: "15px"}}><SVG ariaHidden svg={InfoIcon} /></Button>
                                            <Tooltip style={{border: "1px solid var(--color-primary)", maxWidth: "300px", width: "fit-content", zIndex: "1000", backgroundColor: "var(--color-secondary)", borderRadius: "6px", padding: "5px"}}>
                                                <OverlayArrow>
                                                <svg width={8} height={8} viewBox="0 0 8 8">
                                                    <path d="M0 0 L4 4 L8 0" />
                                                </svg>
                                                </OverlayArrow>
                                                {Object.keys(cleanNames).find((name: string) => name === id) ? cleanNames[id].description : undefined}
                                            </Tooltip>
                                        </TooltipTrigger>
                                        : ""
                                    }
                                    </div>
                                    <div className={hit ? stylesKeys.keyshortElement_shortcut_container_edit : stylesKeys.keyshortElement_shortcut_container}>
                                        <div className={stylesKeys.keyshortElement_shortcut}>
                                            {this.prettifyKeyboardShortcut(def)}
                                            <button
                                                id={`keyEditButt_${id}`}
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
                                                aria-label={`${__("app.edit.title")} (${id}) ${this.stringifyKeyboardShortcut(def)}`}
                                                // title={`${__("app.edit.title")} (${id}) ${this.stringifyKeyboardShortcut(def)}`}
                                            ><SVG ariaHidden svg={EditIcon} /></button>
                                        </div>
                                        {
                                        hit &&
                                        <>
                                            {this.editifyKeyboardShortcut(id, this.state.editKeyboardShortcutData)}
                                                <div className={stylesKeys.action_buttons_container}>
                                                    <button
                                                        id={`keyCancelButt_${id}`}
                                                        className={stylesButtons.button_secondary_blue}
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
                                                        aria-label={`${__("settings.keyboard.cancel")} (${id}) ${this.stringifyKeyboardShortcut(this.state.editKeyboardShortcutData)}`}
                                                        // title={`${__("settings.keyboard.cancel")} (${id}) ${this.stringifyKeyboardShortcut(this.state.editKeyboardShortcutData)}`}
                                                        >
                                                        {hit ?
                                                        __("settings.keyboard.cancel") : ""}
                                                    </button>
                                                    <button
                                                        className={stylesButtons.button_primary_blue}
                                                        onClick={(_ev) => {
                                                            const id_ = id;
                                                            this.onClickKeyboardShortcutSave(id);
                                                            setTimeout(() => {
                                                                const el = document.getElementById(`keyEditButt_${id_}`);
                                                                el?.blur();
                                                                el?.focus();
                                                            }, 100);
                                                        }}
                                                        aria-label={`${__("settings.keyboard.save")} (${id}) ${this.stringifyKeyboardShortcut(this.state.editKeyboardShortcutData)}`}
                                                        // title={`${__("settings.keyboard.save")} (${id}) ${this.stringifyKeyboardShortcut(this.state.editKeyboardShortcutData)}`}
                                                        >
                                                            <SVG ariaHidden svg={SaveIcon} />
                                                        {__("settings.keyboard.save")}
                                                    </button>
                                                </div>
                                            </>
                                        }
                                    </div>
                                    {/* <p className={stylesKeys.keyshortElement_description}>Suspendisse varius risus magna, vitae cursus quam fringilla a.</p> */}
                                </>;
                                return <li
                                        aria-hidden={!this.state.editKeyboardShortcutId || hit ? undefined : true}
                                        className={
                                            hit ?
                                                classNames(stylesKeys.keyshortElement_container)
                                            :
                                            this.state.editKeyboardShortcutId ?
                                            classNames(stylesBlocks.block_line_inactive, stylesKeys.keyshortElement_container)
                                            :
                                            classNames(stylesKeys.keyshortElement_container)
                                        }
                                    key={`key_${id}`}>{
                                    (hit ? <FocusLock
                                        disabled={false}
                                        autoFocus={true}>{frag}</FocusLock> : frag)
                                    }
                                </li>;
                            })}
                            </ul>
                            : 
                            <p>{__("settings.keyboard.noShortcutFound")}</p>
                            }
                        </div>
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
    // private onClickKeyboardShortcutsShow() {
    //     this.props.showKeyboardShortcuts();
    // }
    // private onClickKeyboardShortcutsReload(defaults: boolean) {
    //     this.props.reloadKeyboardShortcuts(defaults);
    // }
    private prettifyKeyboardShortcut(def: TKeyboardShortcut) {
        const alt = def.alt ? <span title={DETECTED_OS === "MacOS" ? "Option" : "Alt"}>{DETECTED_OS === "MacOS" ? <SVG ariaHidden svg={MacOptionIcon} /> : "ALT"} + </span> : null;
        const shift = def.shift ? <span title="Shift"><SVG ariaHidden svg={ShiftIcon} /> + </span> : null;
        const control = def.control ? <span title="Control">CTRL + </span> : null;
        const meta = def.meta ? <span title={DETECTED_OS === "MacOS" ? "Command" : "Meta"}>{DETECTED_OS === "MacOS" ? <SVG ariaHidden svg={MacCmdIcon} /> : "META"} + </span> : null;
        const key = <span>{def.key}</span>;
        return <span aria-hidden>{shift}{control}{alt}{meta}{key}</span>;
    }
    private stringifyKeyboardShortcut(def: TKeyboardShortcut) {
        return `${def.shift ? "SHIFT " : ""}${def.control ? "CTRL " : ""}${def.alt ? "ALT " : ""}${def.meta ? "META " : ""}${(def.shift || def.control || def.alt || def.meta) ? "+ " : ""}${def.key}`;
    }
    private editifyKeyboardShortcut(id: TKeyboardShortcutId, def: TKeyboardShortcut) {

        const alt = <><input
            id={`idcheckbox_${id}_ALT`}
            type="checkbox"
            checked={def.alt ? true : false}
            className={stylesKeys.keyshortElement_shortcut_container_edit_input}
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
            title={DETECTED_OS === "MacOS" ? "Option" : "Alt"}
        >{DETECTED_OS === "MacOS" ? <SVG ariaHidden svg={MacOptionIcon} /> : "ALT"}</label></>;

        const shift = <><input
            id={`idcheckbox_${id}_SHIFT`}
            type="checkbox"
            checked={def.shift ? true : false}
            className={stylesKeys.keyshortElement_shortcut_container_edit_input}
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
            title="Shift"
        ><SVG ariaHidden svg={ShiftIcon} /></label></>;

        const control = <><input
            id={`idcheckbox_${id}_CTRL`}
            type="checkbox"
            checked={def.control ? true : false}
            className={stylesKeys.keyshortElement_shortcut_container_edit_input}
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
            title="Control"
        >CTRL</label></>;

        const meta = <><input
            id={`idcheckbox_${id}_META`}
            type="checkbox"
            checked={def.meta ? true : false}
            className={stylesKeys.keyshortElement_shortcut_container_edit_input}
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
            title={DETECTED_OS === "MacOS" ? "Command" : "Meta"}
        >{DETECTED_OS === "MacOS" ? <SVG ariaHidden svg={MacCmdIcon} /> : "META"}</label></>;

        if (!KEY_CODES.includes(def.key)) {
            KEY_CODES.push(def.key);
        }

        const keySelect =
        <>
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
            className={stylesSettings.form_group}
            id="keySelect"
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

        </>
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
        return <div className={stylesKeys.keyshortElement_shortcut}>{shift}{control}{alt}{meta}{keySelect}{keySink}</div>;
    }
}

const mapStateToProps = (state: ILibraryRootState, _props: IBaseProps) => {
    return {
        keyboardShortcuts: state.keyboard.shortcuts,
        locale: state.i18n.locale, // refresh
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
