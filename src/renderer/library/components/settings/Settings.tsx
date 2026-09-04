// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesModals from "readium-desktop/renderer/assets/styles/components/modals.scss";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";
import { langStringIsRTL } from "@r2-shared-js/_utils/language-string";
// import { DirectionProvider } from "@radix-ui/react-direction";
// import {I18nProvider} from 'react-aria';

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "readium-desktop/renderer/common/components/TabsComponent";
import * as QuitIcon from "readium-desktop/renderer/assets/icons/close-icon.svg";
import * as CogIcon from "readium-desktop/renderer/assets/icons/cog-icon.svg";
import * as PaletteIcon from "readium-desktop/renderer/assets/icons/palette-icon.svg";
import * as KeyReturnIcon from "readium-desktop/renderer/assets/icons/keyreturn-icon.svg";
import * as AvatarIcon from "readium-desktop/renderer/assets/icons/avatar-icon.svg";
import * as LibraryIcon from "readium-desktop/renderer/assets/icons/library-icon.svg";
import SVG from "readium-desktop/renderer/common/components/SVG";
import classNames from "classnames";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
// import * as LanguageIcon from "readium-desktop/renderer/assets/icons/language.svg";
// import * as ChevronDown from "readium-desktop/renderer/assets/icons/chevron-down.svg";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";
import KeyboardSettings, { AdvancedTrigger } from "readium-desktop/renderer/library/components/settings/KeyboardSettings";
import * as GearIcon from "readium-desktop/renderer/assets/icons/gear-icon.svg";
import LanguageSettings from "./LanguageSettings";
import ScreenReaderSettings from "./ScreenReaderSettings";
import ProfilesSettings from "./ProfilesSettings";
import StorageSettings from "./StorageSettings";
import ManageAccessToCatalogSettings from "./ManageAccessToCatalogSettings";
import SaveCreatorSettings from "./SaveCreatorSettings";
import OverloadNoteExportToHtml from "./OverloadNoteExportToHtml";
import SharedComputerSettings from "./SharedComputerSettings";
import WindowBehaviorSettings from "./WindowBehaviorSettings";
import Themes from "./ThemesSettings";
import ConnectionSettings from "./ConnexionSettings";

import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

// import { TagGroup, TagList, Tag, Label } from "react-aria-components";

interface ISettingsProps {};

const TabTitle = (props: React.PropsWithChildren<{title: string}>) => {
    const locale = useSelector((state: ICommonRootState) => state.i18n.locale);
    const isRTL = langStringIsRTL(locale);
    return (
        <div dir={isRTL ? "rtl" : "ltr"} className={stylesSettings.settings_tab_title}>
            <h2 dir={isRTL ? "rtl" : "ltr"}>{props.title}</h2>
            {props.children}
        </div>
    );
};

const ModalControlButton = () => {
    const [__] = useTranslator();
    const locale = useSelector((state: ICommonRootState) => state.i18n.locale);
    const isRTL = langStringIsRTL(locale);
    return (
        <div key="modal-header" className={stylesSettings.close_button_div} style={{justifyContent: isRTL ? "end" : undefined}}>
            <Dialog.Close asChild>
                <button dir={isRTL ? "rtl" : "ltr"} data-css-override="" className={stylesButtons.button_transparency_icon} aria-label={__("accessibility.closeDialog")}>
                    <SVG ariaHidden={true} svg={QuitIcon} />
                </button>
            </Dialog.Close>
        </div>
    );
};

export const Settings: React.FC<ISettingsProps> = () => {
    const [__] = useTranslator();
    const locale = useSelector((state: ICommonRootState) => state.i18n.locale);
    const isRTL = langStringIsRTL(locale);

    const [selectedTab, setSelectedTab] = React.useState("tab1");

    const tabTitle = {
        tab1: __("settings.tabs.general"),
        tab2: __("settings.tabs.appearance"),
        tab4: __("settings.tabs.keyboardShortcuts"),
        tab5: __("settings.tabs.profiles"),
        tab6: __("settings.tabs.storage"),
    }[selectedTab] || __("settings.tabs.general");


    // https://github.com/edrlab/thorium-reader/discussions/3177#discussioncomment-14752676
    // <DirectionProvider dir={isRTL ? "rtl" : "ltr"}> ... </DirectionProvider>
    return <Dialog.Root onOpenChange={(open) => {
        if (!open) {
            setSelectedTab("tab1");
        }
    }}>
        <Dialog.Trigger asChild>
            <button title={__("header.settings")} className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE">
                <SVG ariaHidden svg={GearIcon} />
                <h3 dir={isRTL ? "rtl" : "ltr"} aria-label={__("header.settingsLabel")}>{__("header.settings")}</h3>
            </button>
        </Dialog.Trigger>
        <Dialog.Portal>
            <div className={stylesModals.modal_dialog_overlay}></div>
            <Dialog.Content style={{ overflowY: "hidden" }} className={classNames(stylesModals.modal_dialog)} aria-describedby={undefined}>
                {
                    // FALSE this to test sourcemaps:
                    true &&
                    <VisuallyHidden.Root>
                        <Dialog.Title asChild><h1>{__("header.settings")}</h1></Dialog.Title>
                    </VisuallyHidden.Root>
                }
                <Tabs selectedKey={selectedTab} onSelectionChange={(key) => setSelectedTab(key.toString())} data-orientation="vertical" orientation="vertical" className={stylesSettings.settings_container}>
                    <TabList className={stylesSettings.settings_tabslist} data-orientation="vertical" aria-orientation="vertical">
                        <Tab id="tab1">
                            <SVG ariaHidden svg={CogIcon} />
                            <h3 dir={isRTL ? "rtl" : "ltr"}>{__("settings.tabs.general")}</h3>
                        </Tab>
                        <Tab id="tab2">
                            <SVG ariaHidden svg={PaletteIcon} />
                            <h3 dir={isRTL ? "rtl" : "ltr"}>{__("settings.tabs.appearance")}</h3>
                        </Tab>
                        <Tab id="tab4">
                            <SVG ariaHidden svg={KeyReturnIcon} />
                            <h3 dir={isRTL ? "rtl" : "ltr"}>{__("settings.tabs.keyboardShortcuts")}</h3>
                        </Tab>
                        <Tab id="tab5">
                            <SVG ariaHidden svg={AvatarIcon} />
                            <h3 dir={isRTL ? "rtl" : "ltr"}>{__("settings.tabs.profiles")}</h3>
                        </Tab>
                        <Tab id="tab6">
                            <SVG ariaHidden svg={LibraryIcon} />
                            <h3 dir={isRTL ? "rtl" : "ltr"}>{__("settings.tabs.storage")}</h3>
                        </Tab>
                    </TabList>
                    <TabTitle title={tabTitle}>
                        {
                            tabTitle === __("settings.tabs.keyboardShortcuts") ?
                                <AdvancedTrigger />
                                : <></>
                        }
                    </TabTitle>
                    <div className={stylesSettings.settings_content} style={{ marginTop: "70px" }}>
                            <TabPanels>
                            <TabPanel id="tab1">
                            <div className={stylesSettings.settings_tab}>
                                <LanguageSettings />
                                <ScreenReaderSettings />
                                <WindowBehaviorSettings />
                                <ConnectionSettings />
                                <SharedComputerSettings />
                                {/* <SaveSessionSettings /> */}
                                <ManageAccessToCatalogSettings />
                                <SaveCreatorSettings />
                                <OverloadNoteExportToHtml />
                            </div>
                        </TabPanel>
                        <TabPanel id="tab2">
                            <div className={stylesSettings.settings_tab}>
                                <Themes />
                            </div>
                        </TabPanel>
                        <TabPanel id="tab4">
                            <div className={stylesSettings.settings_tab}>
                                <KeyboardSettings />
                            </div>
                        </TabPanel>
                        <TabPanel id="tab5">
                            <div className={stylesSettings.settings_tab}>
                                <ProfilesSettings />
                            </div>
                        </TabPanel>
                        <TabPanel id="tab6">
                            <div className={stylesSettings.settings_tab}>
                                <StorageSettings />
                            </div>
                        </TabPanel>
                        </TabPanels>
                    </div>
                    <ModalControlButton />
                </Tabs>

                {/* <div className={stylesSettings.close_button_div}>
                    <Dialog.Close asChild>
                        <button data-css-override="" className={stylesButtons.button_transparency_icon} aria-label={__("accessibility.closeDialog")}>
                            <SVG ariaHidden={true} svg={QuitIcon} />
                        </button>
                    </Dialog.Close>
                </div> */}
            </Dialog.Content>
        </Dialog.Portal>
    </Dialog.Root>;
};
