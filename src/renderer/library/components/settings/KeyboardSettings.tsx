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
    systemOs: string;
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
            systemOs: "",
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

        const userAgent = window.navigator.userAgent;
        let detectedOS = "Unknown";

        if (userAgent.indexOf("Win") !== -1) {
            detectedOS = "Windows";
        } else if (userAgent.indexOf("Mac") !== -1) {
            detectedOS = "MacOS";
        } else if (userAgent.indexOf("X11") !== -1) {
            detectedOS = "UNIX";
        } else if (userAgent.indexOf("Linux") !== -1) {
            detectedOS = "Linux";
        }

        this.setState({systemOs: detectedOS});
    }

    public componentWillUnmount() {
        document.removeEventListener("keyup", this.onKeyUp);
    }

    public render(): React.ReactElement<{}> {
        const { __ } = this.props;

        const isSearchEmpty = !this.state.searchItem || this.state.searchItem.trim() === "";

        const cleanNames = {
            AddBookmarkWithLabel: {
                name: `${__("settings.keyboard.name.AddBookmarkWithLabel")}`,
                description: `${__("settings.keyboard.description.AddBookmarkWithLabelDesc")}`,
            },
            AnnotationsCreate: {
                name: `${__("settings.keyboard.name.AnnotationsCreate")}`,
                description: `${__("settings.keyboard.description.AnnotationsCreateDesc")}`,
            },
            AnnotationsCreateQuick: {
                name: `${__("settings.keyboard.name.AnnotationsCreateQuick")}`,
                description: `${__("settings.keyboard.description.AnnotationsCreateQuickDesc")}`,
            },
            AnnotationsToggleMargin: {
                name: `${__("settings.keyboard.name.AnnotationsToggleMargin")}`,
                description: `${__("settings.keyboard.description.AnnotationsToggleMarginDesc")}`,
            },
            AudioNext: {
                name: `${__("settings.keyboard.name.AudioNext")}`,
                description: `${__("settings.keyboard.description.AudioNextDesc")}`,
            },
            AudioNextAlt: {
                name: `${__("settings.keyboard.name.AudioNextAlt")}`,
                description: `${__("settings.keyboard.description.AudioNextAltDesc")}`,
            },
            AudioPlayPause: {
                name: `${__("settings.keyboard.name.AudioPlayPause")}`,
                description: `${__("settings.keyboard.description.AudioPlayPauseDesc")}`,
            },
            AudioPrevious: {
                name: `${__("settings.keyboard.name.AudioPrevious")}`,
                description: `${__("settings.keyboard.description.AudioPreviousDesc")}`,
            },
            AudioPreviousAlt: {
                name: `${__("settings.keyboard.name.AudioPreviousAlt")}`,
                description: `${__("settings.keyboard.description.AudioPreviousAltDesc")}`,
            },
            AudioStop: {
                name: `${__("settings.keyboard.name.AudioStop")}`,
                description: `${__("settings.keyboard.description.AudioStopDesc")}`,
            },
            CloseReader: {
                name: `${__("settings.keyboard.name.CloseReader")}`,
                description: `${__("settings.keyboard.description.CloseReaderDesc")}`,
            },
            FXLZoomIn: {
                name: `${__("settings.keyboard.name.FXLZoomIn")}`,
                description: `${__("settings.keyboard.description.FXLZoomInDesc")}`,
            },
            FXLZoomOut: {
                name: `${__("settings.keyboard.name.FXLZoomOut")}`,
                description: `${__("settings.keyboard.description.FXLZoomOutDesc")}`,
            },
            FXLZoomReset: {
                name: `${__("settings.keyboard.name.FXLZoomReset")}`,
                description: `${__("settings.keyboard.description.FXLZoomResetDesc")}`,
            },
            FocusMain: {
                name: `${__("settings.keyboard.name.FocusMain")}`,
                description: `${__("settings.keyboard.description.FocusMainDesc")}`,
            },
            FocusMainDeep: {
                name: `${__("settings.keyboard.name.FocusMainDeep")}`,
                description: `${__("settings.keyboard.description.FocusMainDeepDesc")}`,
            },
            FocusReaderGotoPage: {
                name: `${__("settings.keyboard.name.FocusReaderGotoPage")}`,
                description: `${__("settings.keyboard.description.FocusReaderGotoPageDesc")}`,
            },
            FocusReaderNavigation: {
                name: `${__("settings.keyboard.name.FocusReaderNavigation")}`,
                description: `${__("settings.keyboard.description.FocusReaderNavigationDesc")}`,
            },
            FocusReaderNavigationAnnotations: {
                name: `${__("settings.keyboard.name.FocusReaderNavigationAnnotations")}`,
                description: `${__("settings.keyboard.description.FocusReaderNavigationAnnotationsDesc")}`,
            },
            FocusReaderNavigationBookmarks: {
                name: `${__("settings.keyboard.name.FocusReaderNavigationBookmarks")}`,
                description: `${__("settings.keyboard.description.FocusReaderNavigationBookmarksDesc")}`,
            },
            FocusReaderNavigationSearch: {
                name: `${__("settings.keyboard.name.FocusReaderNavigationSearch")}`,
                description: `${__("settings.keyboard.description.FocusReaderNavigationSearchDesc")}`,
            },
            FocusReaderNavigationTOC: {
                name: `${__("settings.keyboard.name.FocusReaderNavigationTOC")}`,
                description: `${__("settings.keyboard.description.FocusReaderNavigationTOCDesc")}`,
            },
            FocusReaderSettings: {
                name: `${__("settings.keyboard.name.FocusReaderSettings")}`,
                description: `${__("settings.keyboard.description.FocusReaderSettingsDesc")}`,
            },
            FocusSearch: {
                name: `${__("settings.keyboard.name.FocusSearch")}`,
                description: `${__("settings.keyboard.description.FocusSearchDesc")}`,
            },
            FocusToolbar: {
                name: `${__("settings.keyboard.name.FocusToolbar")}`,
                description: `${__("settings.keyboard.description.FocusToolbarDesc")}`,
            },
            NavigateNextChapter: {
                name: `${__("settings.keyboard.name.NavigateNextChapter")}`,
                description: `${__("settings.keyboard.description.NavigateNextChapterDesc")}`,
            },
            NavigateNextChapterAlt: {
                name: `${__("settings.keyboard.name.NavigateNextChapterAlt")}`,
                description: `${__("settings.keyboard.description.NavigateNextChapterAltDesc")}`,
            },
            NavigateNextHistory: {
                name: `${__("settings.keyboard.name.NavigateNextHistory")}`,
                description: `${__("settings.keyboard.description.NavigateNextHistoryDesc")}`,
            },
            NavigateNextLibraryPage: {
                name: `${__("settings.keyboard.name.NavigateNextLibraryPage")}`,
                description: `${__("settings.keyboard.description.NavigateNextLibraryPageDesc")}`,
            },
            NavigateNextLibraryPageAlt: {
                name: `${__("settings.keyboard.name.NavigateNextLibraryPageAlt")}`,
                description: `${__("settings.keyboard.description.NavigateNextLibraryPageAltDesc")}`,
            },
            NavigateNextOPDSPage: {
                name: `${__("settings.keyboard.name.NavigateNextOPDSPage")}`,
                description: `${__("settings.keyboard.description.NavigateNextOPDSPageDesc")}`,
            },
            NavigateNextOPDSPageAlt: {
                name: `${__("settings.keyboard.name.NavigateNextOPDSPageAlt")}`,
                description: `${__("settings.keyboard.description.NavigateNextOPDSPageAltDesc")}`,
            },
            NavigateNextPage: {
                name: `${__("settings.keyboard.name.NavigateNextPage")}`,
                description: `${__("settings.keyboard.description.NavigateNextPageDesc")}`,
            },
            NavigateNextPageAlt: {
                name: `${__("settings.keyboard.name.NavigateNextPageAlt")}`,
                description: `${__("settings.keyboard.description.NavigateNextPageAltDesc")}`,
            },
            NavigatePreviousChapter: {
                name: `${__("settings.keyboard.name.NavigatePreviousChapter")}`,
                description: `${__("settings.keyboard.description.NavigatePreviousChapterDesc")}`,
            },
            NavigatePreviousChapterAlt: {
                name: `${__("settings.keyboard.name.NavigatePreviousChapterAlt")}`,
                description: `${__("settings.keyboard.description.NavigatePreviousChapterAltDesc")}`,
            },
            NavigatePreviousHistory: {
                name: `${__("settings.keyboard.name.NavigatePreviousHistory")}`,
                description: `${__("settings.keyboard.description.NavigatePreviousHistoryDesc")}`,
            },
            NavigatePreviousLibraryPage: {
                name: `${__("settings.keyboard.name.NavigatePreviousLibraryPage")}`,
                description: `${__("settings.keyboard.description.NavigatePreviousLibraryPageDesc")}`,
            },
            NavigatePreviousLibraryPageAlt: {
                name: `${__("settings.keyboard.name.NavigatePreviousLibraryPageAlt")}`,
                description: `${__("settings.keyboard.description.NavigatePreviousLibraryPageAltDesc")}`,
            },
            NavigatePreviousOPDSPage: {
                name: `${__("settings.keyboard.name.NavigatePreviousOPDSPage")}`,
                description: `${__("settings.keyboard.description.NavigatePreviousOPDSPageDesc")}`,
            },
            NavigatePreviousOPDSPageAlt: {
                name: `${__("settings.keyboard.name.NavigatePreviousOPDSPageAlt")}`,
                description: `${__("settings.keyboard.description.NavigatePreviousOPDSPageAltDesc")}`,
            },
            NavigatePreviousPage: {
                name: `${__("settings.keyboard.name.NavigatePreviousPage")}`,
                description: `${__("settings.keyboard.description.NavigatePreviousPageDesc")}`,
            },
            NavigatePreviousPageAlt: {
                name: `${__("settings.keyboard.name.NavigatePreviousPageAlt")}`,
                description: `${__("settings.keyboard.description.NavigatePreviousPageAltDesc")}`,
            },
            NavigateToBegin: {
                name: `${__("settings.keyboard.name.NavigateToBegin")}`,
                description: `${__("settings.keyboard.description.NavigateToBeginDesc")}`,
            },
            NavigateToEnd: {
                name: `${__("settings.keyboard.name.NavigateToEnd")}`,
                description: `${__("settings.keyboard.description.NavigateToEndDesc")}`,
            },
            OpenReaderInfo: {
                name: `${__("settings.keyboard.name.OpenReaderInfo")}`,
                description: `${__("settings.keyboard.description.OpenReaderInfoDesc")}`,
            },
            OpenReaderInfoWhereAmI: {
                name: `${__("settings.keyboard.name.OpenReaderInfoWhereAmI")}`,
                description: `${__("settings.keyboard.description.OpenReaderInfoWhereAmIDesc")}`,
            },
            SearchNext: {
                name: `${__("settings.keyboard.name.SearchNext")}`,
                description: `${__("settings.keyboard.description.SearchNextDesc")}`,
            },
            SearchNextAlt: {
                name: `${__("settings.keyboard.name.SearchNextAlt")}`,
                description: `${__("settings.keyboard.description.SearchNextAltDesc")}`,
            },
            SearchPrevious: {
                name: `${__("settings.keyboard.name.SearchPrevious")}`,
                description: `${__("settings.keyboard.description.SearchPreviousDesc")}`,
            },
            SearchPreviousAlt: {
                name: `${__("settings.keyboard.name.SearchPreviousAlt")}`,
                description: `${__("settings.keyboard.description.SearchPreviousAltDesc")}`,
            },
            SpeakReaderInfoWhereAmI: {
                name: `${__("settings.keyboard.name.SpeakReaderInfoWhereAmI")}`,
                description: `${__("settings.keyboard.description.SpeakReaderInfoWhereAmIDesc")}`,
            },
            ToggleBookmark: {
                name: `${__("settings.keyboard.name.ToggleBookmark")}`,
                description: `${__("settings.keyboard.description.ToggleBookmarkDesc")}`,
            },
            ToggleReaderFullscreen: {
                name: `${__("settings.keyboard.name.ToggleReaderFullscreen")}`,
                description: `${__("settings.keyboard.description.ToggleReaderFullscreenDesc")}`,
            },
        };


        const filteredShortcuts = isSearchEmpty
            ? ObjectKeys(sortObject(this.props.keyboardShortcuts) as TKeyboardShortcutsMap)
            : ObjectKeys(cleanNames).filter(key => cleanNames[key].name.toLowerCase().includes(this.state.searchItem?.toLowerCase()));

        const exportHtml = () => {
            const element = document.getElementById("content-to-export");

            if (element) {
                let htmlContent = element.outerHTML;

                const replaceSvgWithSpanName = (html: string): string => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, "text/html");
                    const spans = doc.querySelectorAll("span[title]");

                    spans.forEach((span) => {
                        const spanName = span.getAttribute("title") || "";
                        span.innerHTML = `${spanName} + `;
                    });

                    return doc.body.innerHTML;
                };

                htmlContent = replaceSvgWithSpanName(htmlContent);


                const getCssStyles = (): string => {
                    let css = "";
                    const styleSheets = document.styleSheets;

                    for (let i = 0; i < styleSheets.length; i++) {
                        const rules = styleSheets[i].cssRules;
                        if (rules) {
                            for (let j = 0; j < rules.length; j++) {
                                css += rules[j].cssText;
                            }
                        }
                    }
                    return css;
                };

                const cssStyles = getCssStyles();

                const completeHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>THORIUM DESKTOP Keyboard Shortcuts</title>
          <style>
            ${cssStyles}
            h1, h2 {
            text-align: center
            }
            .keyshortElement_container {
                border-bottom: none
            }
          </style>
        </head>
        <body>
            <h1>THORIUM DESKTOP</h1>
            <h2>Keyboard Shortcuts</h2>
          ${htmlContent}
        </body>
        </html>
      `;

                const blob = new Blob([completeHtml], { type: "text/html" });

                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = "thorium_shortcuts.html";

                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        };
          
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
                            <div style={{display: "flex", justifyContent: "space-between"}}>
                        <input
                            type="text"
                            value={this.state.searchItem}
                            onChange={(e) => this.setState({searchItem: e.target.value})}
                            placeholder={__("settings.keyboard.searchPlaceholder")}
                            style={{width: "200px", borderRadius: "4px"}}
                        />
                         <button onClick={exportHtml} className={stylesButtons.button_secondary_blue}>Exporter en HTML</button>
                         </div>
                        {filteredShortcuts.length ?
                            <ul className={stylesGlobal.p_0} id="content-to-export">
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
                                                <p className="shortcut_description">
                                                    {Object.keys(cleanNames).find((name: string) => name === id) ? cleanNames[id].description : undefined}
                                                </p>
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
        const alt = def.alt ? <span title={this.state.systemOs === "MacOS" ? "Option" : "Alt"}>{this.state.systemOs === "MacOS" ? <SVG ariaHidden svg={MacOptionIcon} /> : "ALT"} + </span> : null;
        const shift = def.shift ? <span title="Shift"><SVG ariaHidden svg={ShiftIcon} /> + </span> : null;
        const control = def.control ? <span title="Control">CTRL + </span> : null;
        const meta = def.meta ? <span title={this.state.systemOs === "MacOS" ? "Command" : "Meta"}>{this.state.systemOs === "MacOS" ? <SVG ariaHidden svg={MacCmdIcon} /> : "META"} + </span> : null;
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
            title={this.state.systemOs === "MacOS" ? "Option" : "Alt"}
        >{this.state.systemOs === "MacOS" ? <SVG ariaHidden svg={MacOptionIcon} /> : "ALT"}</label></>;

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
            title={this.state.systemOs === "MacOS" ? "Command" : "Meta"}
        >{this.state.systemOs === "MacOS" ? <SVG ariaHidden svg={MacCmdIcon} /> : "META"}</label></>;

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
