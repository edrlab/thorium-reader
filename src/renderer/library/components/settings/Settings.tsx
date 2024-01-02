// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Tabs from "@radix-ui/react-tabs";
import * as QuitIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px.svg";
import * as CogIcon from "readium-desktop/renderer/assets/icons/cog-icon.svg";
import * as PaletteIcon from "readium-desktop/renderer/assets/icons/palette-icon.svg";
import * as KeyReturnIcon from "readium-desktop/renderer/assets/icons/keyreturn-icon.svg";
import SVG from "readium-desktop/renderer/common/components/SVG";
import * as stylesModals from "readium-desktop/renderer/assets/styles/components/modals.css";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.css";
import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";
import * as stylesCombobox from "readium-desktop/renderer/assets/styles/components/combobox.scss";
import classNames from "classnames";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { IRendererCommonRootState } from "readium-desktop/common/redux/states/rendererCommonRootState";
import { AvailableLanguages } from "readium-desktop/common/services/translator";
// import * as LanguageIcon from "readium-desktop/renderer/assets/icons/language.svg";
// import * as ChevronDown from "readium-desktop/renderer/assets/icons/chevron-down.svg";
import { ComboBox, ComboBoxItem } from "readium-desktop/renderer/common/components/ComboBox";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import { i18nActions } from "readium-desktop/common/redux/actions";

stylesCombobox.focused;

interface ISettingsProps {};

const TabTitle = (props: React.PropsWithChildren<{title: string}>) => {
    return (
        <div className={stylesSettings.settings_tab_title}>
            <h2>{props.title}</h2>
            {props.children}
        </div>
    );
};

const LanguageSettings: React.FC<{}> = () => {
    const [__] = useTranslator();
    const locale = useSelector((state: IRendererCommonRootState) => state.i18n.locale);
    const currentLanguageISO = locale as keyof typeof AvailableLanguages;
    const currentLanguageString = AvailableLanguages[currentLanguageISO];
    const dispatch = useDispatch();
    const [options] = React.useState(() => Object.entries(AvailableLanguages).map(([k,v], i) => ({id: i, name: v, iso: k})));
    const setLang = (localeSelected: React.Key) => {
       
        if (typeof localeSelected !== "number") return;
        const obj = options.find(({id}) => id === localeSelected);
        dispatch(i18nActions.setLocale.build(obj.iso));
    }
    const selectedKey = options.find(({name}) => name === currentLanguageString);
    return (
        <ComboBox label={__("settings.language.languageChoice")} items={options} selectedKey={selectedKey?.id} onSelectionChange={setLang}>
            {item => <ComboBoxItem>{item.name}</ComboBoxItem>}
        </ComboBox>
    );
};

export const Settings: React.FC<ISettingsProps> = () => {
    const [__] = useTranslator();
    
    return <Dialog.Root>
        <Dialog.Trigger asChild>

            <button
                className={stylesButtons.button_transparency_icon}
            >
                Settings
            </button>
        </Dialog.Trigger>
        <Dialog.Portal>
            <div className={stylesModals.modal_dialog_overlay}></div>
            <Dialog.Content className={classNames(stylesModals.modal_dialog)}>
                <Tabs.Root defaultValue="tab1" data-orientation="vertical" orientation="vertical" className={stylesSettings.settings_container}>
                    <Tabs.List className={stylesSettings.settings_tabslist} data-orientation="vertical" aria-orientation="vertical">
                        <Tabs.Trigger value="tab1">
                            <SVG ariaHidden svg={CogIcon} />
                            <h4>{__("settings.tabs.general")}</h4>
                        </Tabs.Trigger>
                        <Tabs.Trigger value="tab2">
                            <SVG ariaHidden svg={PaletteIcon} />
                            <h4>{__("settings.tabs.appearance")}</h4>
                        </Tabs.Trigger>
                        <Tabs.Trigger value="tab4">
                            <SVG ariaHidden svg={KeyReturnIcon} />
                            <h4>{__("settings.tabs.keyboardShortcuts")}</h4>
                        </Tabs.Trigger>
                    </Tabs.List>
                    <div className={stylesSettings.settings_content}>
                        <Tabs.Content value="tab1" title="General" tabIndex={-1}>
                            <TabTitle title={__("settings.tabs.general")} />
                            <section className={stylesSettings.settings_tab}>
                                <LanguageSettings />
                                {/* <ConnectionSettings /> */}
                            </section>
                        </Tabs.Content>
                        <Tabs.Content value="tab2" tabIndex={-1}>
                            <TabTitle title={__("settings.tabs.appearance")} />
                            {/* <section className={stylesSettings.settings_tab}>
                                <Themes />
                            </section> */}
                        </Tabs.Content>
                        <Tabs.Content value="tab4" tabIndex={-1}>
                            <TabTitle title={__("settings.tabs.keyboardShortcuts")}>
                                {/* <AdvancedTrigger /> */}
                            </TabTitle>
                            {/* <KeyboardSettings /> */}
                        </Tabs.Content>
                    </div>
                </Tabs.Root>
                <div className={stylesSettings.close_button_div}>
                    <Dialog.Close asChild>
                        <button className={stylesButtons.button_transparency_icon} aria-label="Close">
                            <SVG ariaHidden={true} svg={QuitIcon} />
                        </button>
                    </Dialog.Close>
                </div>
            </Dialog.Content>
        </Dialog.Portal>
    </Dialog.Root>
}