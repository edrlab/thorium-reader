// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesModals from "readium-desktop/renderer/assets/styles/components/modals.scss";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.scss";
import * as stylesAnnotations from "readium-desktop/renderer/assets/styles/components/annotations.scss";
import * as stylesInput from "readium-desktop/renderer/assets/styles/components/inputs.scss";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Tabs from "@radix-ui/react-tabs";
import * as QuitIcon from "readium-desktop/renderer/assets/icons/close-icon.svg";
import * as CogIcon from "readium-desktop/renderer/assets/icons/cog-icon.svg";
import * as PaletteIcon from "readium-desktop/renderer/assets/icons/palette-icon.svg";
import * as KeyReturnIcon from "readium-desktop/renderer/assets/icons/keyreturn-icon.svg";
import SVG from "readium-desktop/renderer/common/components/SVG";
import classNames from "classnames";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { availableLanguages } from "readium-desktop/common/services/translator";
// import * as LanguageIcon from "readium-desktop/renderer/assets/icons/language.svg";
// import * as ChevronDown from "readium-desktop/renderer/assets/icons/chevron-down.svg";
import { ComboBox, ComboBoxItem } from "readium-desktop/renderer/common/components/ComboBox";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import { authActions, creatorActions, i18nActions, sessionActions, settingsActions, themeActions } from "readium-desktop/common/redux/actions";
import * as BinIcon from "readium-desktop/renderer/assets/icons/trash-icon.svg";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";
import { TTheme } from "readium-desktop/common/redux/states/theme";
import * as InfoIcon from "readium-desktop/renderer/assets/icons/info-icon.svg";
import * as LanguageIcon from "readium-desktop/renderer/assets/icons/language.svg";
import * as BrushIcon from "readium-desktop/renderer/assets/icons/paintbrush-icon.svg";
import KeyboardSettings, { AdvancedTrigger } from "readium-desktop/renderer/library/components/settings/KeyboardSettings";
import * as GearIcon from "readium-desktop/renderer/assets/icons/gear-icon.svg";
import * as CheckIcon from "readium-desktop/renderer/assets/icons/singlecheck-icon.svg";
import debounce from "debounce";
import { IAnnotationCreator } from "readium-desktop/common/redux/states/creator";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import { ApiappHowDoesItWorkInfoBox } from "../dialog/ApiappAddForm";
// import { TagGroup, TagList, Tag, Label } from "react-aria-components";

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
    // const locale = useSelector((state: IRendererCommonRootState) => state.i18n.locale);
    const locale = useSelector((state: ICommonRootState) => state.i18n.locale);

    const currentLanguageISO = locale as keyof typeof availableLanguages;
    const currentLanguageString = availableLanguages[currentLanguageISO];
    const dispatch = useDispatch();
    const [options] = React.useState(() => (Object.entries(availableLanguages) as Array<[keyof typeof availableLanguages, string]>)
        .sort()
        .map<{ id: number, name: string, iso: keyof typeof availableLanguages }>(
            ([k, v], i) => ({ id: i, name: v, iso: k }),
        ));
    const setLang = (localeSelected: React.Key) => {

        if (typeof localeSelected !== "number") return;
        const obj = options.find(({id}) => id === localeSelected);
        dispatch(i18nActions.setLocale.build(obj.iso));
    };
    const selectedKey = options.find(({name}) => name === currentLanguageString);
    return (
        <ComboBox label={__("settings.language.languageChoice")} defaultItems={options} defaultSelectedKey={selectedKey?.id} onSelectionChange={setLang} svg={LanguageIcon}>
            {item => <ComboBoxItem>{item.name}</ComboBoxItem>}
        </ComboBox>
    );
};

export const Auth = () => {
    const [__] = useTranslator();
    const dispatch = useDispatch();

    return (
        <button
            className={stylesSettings.btn_primary}
            onClick={() => dispatch(authActions.wipeData.build())}>
            <SVG ariaHidden svg={BinIcon} />
            <p>{__("settings.auth.wipeData")}</p>
        </button>
    );
};

const ConnectionSettings: React.FC<{}> = () => {
    const [__] = useTranslator();
    return (
        <section className={stylesSettings.section} style={{ position: "relative" }}>
            <h4>{__("settings.auth.title")}</h4>
            <Auth />
        </section>
    );
};

const SaveSessionSettings: React.FC<{}> = () => {
    const [__] = useTranslator();
    const dispatch = useDispatch();
    const sessionSaveState = useSelector((state: ICommonRootState) => state.session.save);
    const onChange = () => {
        dispatch(sessionActions.save.build(!sessionSaveState));
    };
    return (
        <section className={stylesSettings.section} style={{ position: "relative" }}>
            <h4>{__("app.session.exit.askBox.message")}</h4>
            <div className={stylesAnnotations.annotations_checkbox}>
                <input type="checkbox" id="saveSessionSettings" className={stylesGlobal.checkbox_custom_input} name="saveSessionSettings" checked={sessionSaveState} onChange={onChange} />
                <label htmlFor="saveSessionSettings" className={stylesGlobal.checkbox_custom_label}>
                    <div
                        tabIndex={0}
                        role="checkbox"
                        aria-checked={sessionSaveState}
                        aria-label={__("settings.session.title")}
                        onKeyDown={(e) => {
                            // if (e.code === "Space") {
                            if (e.key === " ") {
                                e.preventDefault(); // prevent scroll
                            }
                        }}
                        onKeyUp={(e) => {
                            // if (e.code === "Space") {
                            if (e.key === " ") {
                                e.preventDefault();
                                onChange();
                            }
                        }}
                        className={stylesGlobal.checkbox_custom}
                        style={{ border: sessionSaveState ? "2px solid transparent" : "2px solid var(--color-primary)", backgroundColor: sessionSaveState ? "var(--color-blue)" : "transparent" }}>
                        {sessionSaveState ?
                            <SVG ariaHidden svg={CheckIcon} />
                            :
                            <></>
                        }
                    </div>
                    <div aria-hidden>
                        <h4>{__("settings.session.title")}</h4>
                    </div>
                </label>
            </div>
        </section>
    );
};



const SaveCreatorSettings: React.FC<{}> = () => {
    const [__] = useTranslator();
    const dispatch = useDispatch();
    const creator = useSelector((state: ICommonRootState) => state.creator);

    const [name, setName] = React.useState(creator.name);
    const [type, setType] = React.useState(creator.type);

    const onChangeDebounced = React.useMemo(() =>
        debounce(
            (name: string, type: IAnnotationCreator["type"]) => dispatch(creatorActions.set.build(name, type))
            , 1000)
        , [dispatch]);
    React.useEffect(() => {
        if (name !== creator.name || type !== creator.type) {
            onChangeDebounced(name, type);
        }
    }, [name, type, creator, onChangeDebounced]);

    return (
        <section className={stylesSettings.section} style={{ position: "relative" }}>
            <h4>{__("settings.annotationCreator.creator")}</h4>
            <div className={stylesInput.form_group} style={{marginTop: "20px", width: "360px"}}>
                <input type="text" name="creator-name" style={{width: "100%", marginLeft: "10px"}} className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE" title={name} value={name} onChange={(e) => {
                    const v = e.target.value;
                    setName(v);
                }} />
                <label htmlFor="creator-name">{__("settings.annotationCreator.name")}</label>
            </div>
            <div className={stylesAnnotations.annotations_filter_taglist} style={{ margin: "10px" }}>
                    <p>{__("settings.annotationCreator.type")}</p>
                    <div className={stylesAnnotations.annotations_filter_tag}>
                        <input type="radio" id="creator-organizationType" style={{display: "none"}} name="creator-type" value="Organization" checked={type === "Organization"} onChange={(e) => {
                            const t = e.target.value;
                            if (t === "Organization") {
                                setType(t);
                            }
                        }}/>
                            <label htmlFor="creator-organizationType">{__("settings.annotationCreator.organization")}</label>
                    </div>
                    <div className={stylesAnnotations.annotations_filter_tag}>
                        <input type="radio" id="creator-personType" style={{display: "none"}} name="creator-type" value="Person" checked={type === "Person"} onChange={(e) => {
                            const t = e.target.value;
                            if (t === "Person") {
                                setType(t);
                            }
                        }}/>
                            <label htmlFor="creator-personType">{__("settings.annotationCreator.person")}</label>
                    </div>
            </div>
        </section>
    );
};

const ManageAccessToCatalogSettings = () => {

    const [__] = useTranslator();
    const dispatch = useDispatch();
    const enableAPIAPP = useSelector((state: ILibraryRootState) => state.settings.enableAPIAPP);

    const toggleEnableAPIAPP = () => {
        dispatch(settingsActions.enableAPIAPP.build(!enableAPIAPP));
    };

    return (
        <section className={stylesSettings.section} style={{ gap: "10px" }}>
            <h4>{__("settings.library.title")}</h4>
            <div className={stylesAnnotations.annotations_checkbox}>
                <input type="checkbox" id="enableAPIAPP" className={stylesGlobal.checkbox_custom_input} name="enableAPIAPP" checked={enableAPIAPP} onChange={toggleEnableAPIAPP} />
                <label htmlFor="enableAPIAPP" className={stylesGlobal.checkbox_custom_label}>
                    <div
                        tabIndex={0}
                        role="checkbox"
                        aria-checked={enableAPIAPP}
                        aria-label={__("settings.library.enableAPIAPP")}
                        onKeyDown={(e) => {
                            // if (e.code === "Space") {
                            if (e.key === " ") {
                                e.preventDefault(); // prevent scroll
                            }
                        }}
                        onKeyUp={(e) => {
                            // if (e.code === "Space") {
                            if (e.key === " ") {
                                e.preventDefault();
                                toggleEnableAPIAPP();
                            }
                        }}
                        className={stylesGlobal.checkbox_custom}
                        style={{ border: enableAPIAPP ? "2px solid transparent" : "2px solid var(--color-primary)", backgroundColor: enableAPIAPP ? "var(--color-blue)" : "transparent" }}>
                        {enableAPIAPP ?
                            <SVG ariaHidden svg={CheckIcon} />
                            :
                            <></>
                        }
                    </div>
                    <div aria-hidden>
                        <h4>{__("settings.library.enableAPIAPP")}</h4>
                    </div>
                </label>
            </div>
            <ApiappHowDoesItWorkInfoBox />
        </section>
    );
};

const Themes = () => {
    const [__] = useTranslator();
    const dispatch = useDispatch();
    const theme = useSelector((s: ICommonRootState) => s.theme);
    const options: Array<{id: number, value: TTheme, name: string}> = [
        {id: 1, value: "dark", name: __("settings.theme.dark")},
        {id: 2, value: "light", name: __("settings.theme.light")},
        {id: 3, value: "system", name: __("settings.theme.auto")},
    ];

    const setTheme = (themeSelected: React.Key) => {

        if (typeof themeSelected !== "number") return;
        const { value: themeChosen } = options.find(({ id }) => id === themeSelected) || {};
        document.body.setAttribute("data-theme", themeChosen);
        dispatch(themeActions.setTheme.build(themeChosen));
    };
    const selectedKey = options.find(({ value }) => value === theme.name);

    return (
        <div>
            <ComboBox label={__("settings.theme.title")} items={options} selectedKey={selectedKey?.id} onSelectionChange={setTheme} svg={BrushIcon}>
                {item => <ComboBoxItem>{item.name}</ComboBoxItem>}
            </ComboBox>
            {theme.name === "system" ? (
                <div className={stylesSettings.session_text}>
                    <SVG ariaHidden svg={InfoIcon} />
                    <p>{__("settings.theme.description")}</p>
                </div>
            ) : (
                <></>
            )}
        </div>
    );
};

const TabHeader = (props: React.PropsWithChildren<{title: string}>) => {
    const [__] = useTranslator();
    return (
        <div key="modal-header" className={stylesSettings.close_button_div}>
            <TabTitle title={props.title}>
            {props.children}
            </TabTitle>
            <Dialog.Close asChild>
                <button data-css-override="" className={stylesButtons.button_transparency_icon} aria-label={__("accessibility.closeDialog")}>
                    <SVG ariaHidden={true} svg={QuitIcon} />
                </button>
            </Dialog.Close>
        </div>
    );
};


export const Settings: React.FC<ISettingsProps> = () => {
    const [__] = useTranslator();

    return <Dialog.Root>
        <Dialog.Trigger asChild>
        <button title={__("header.settings")} className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE">
            <SVG ariaHidden svg={GearIcon} />
            <h3>{__("header.settings")}</h3>
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
                    <div className={stylesSettings.settings_content} style={{marginTop: "70px"}}>
                        <Tabs.Content value="tab1" title="General" tabIndex={-1}>
                            <TabHeader title={__("settings.tabs.general")} />
                            <div className={stylesSettings.settings_tab}>
                                <LanguageSettings />
                                <ConnectionSettings />
                                <SaveSessionSettings />
                                <ManageAccessToCatalogSettings />
                                <SaveCreatorSettings />
                            </div>
                        </Tabs.Content>
                        <Tabs.Content value="tab2" tabIndex={-1}>
                            <TabHeader title={__("settings.tabs.appearance")} />
                            <div className={stylesSettings.settings_tab}>
                                <Themes />
                            </div>
                        </Tabs.Content>
                        <Tabs.Content value="tab4" tabIndex={-1}>
                            <TabHeader title={__("settings.tabs.keyboardShortcuts")}>
                                <AdvancedTrigger />
                            </TabHeader>
                            <div className={stylesSettings.settings_tab}>
                                <KeyboardSettings />
                            </div>
                        </Tabs.Content>
                    </div>
                </Tabs.Root>

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
