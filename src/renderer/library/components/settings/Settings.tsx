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
import * as AddIcon from "readium-desktop/renderer/assets/icons/add-alone.svg";
import * as PaletteIcon from "readium-desktop/renderer/assets/icons/palette-icon.svg";
import * as KeyReturnIcon from "readium-desktop/renderer/assets/icons/keyreturn-icon.svg";
import * as EyeOpenIcon from "readium-desktop/renderer/assets/icons/eye-icon.svg";
import * as EyeClosedIcon from "readium-desktop/renderer/assets/icons/eye-password-hide-icon.svg";
import SVG, { ISVGProps } from "readium-desktop/renderer/common/components/SVG";
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
import * as FloppyDiskIcon from "readium-desktop/renderer/assets/icons/floppydisk-icon.svg";
import debounce from "debounce";
import { INoteCreator } from "readium-desktop/common/redux/states/creator";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import { ApiappHowDoesItWorkInfoBox } from "../dialog/ApiappAddForm";
import * as RadioGroup from "@radix-ui/react-radio-group";
// import { TagGroup, TagList, Tag, Label } from "react-aria-components";
import * as OpenAiIcon from "readium-desktop/renderer/assets/icons/open-ai-icon.svg";
import * as MistralAiIcon from "readium-desktop/renderer/assets/icons/mistral-ai-icon.svg";
import * as stylesChatbot from "readium-desktop/renderer/assets/styles/chatbot.scss";

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
        <ComboBox label={__("settings.language.languageChoice")} defaultItems={options} defaultSelectedKey={selectedKey?.id} onSelectionChange={setLang} svg={LanguageIcon} style={{borderBottom: "2px solid var(--color-extralight-grey)"}}>
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
            <div className={stylesSettings.session_text}>
                <SVG ariaHidden svg={InfoIcon} />
                <p>{__("settings.auth.help")}</p>
            </div>
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
            <div className={stylesSettings.session_text} style={{ margin: "0" }}>
                <SVG ariaHidden svg={InfoIcon} />
                <p>{__("app.session.exit.askBox.help")}</p>
            </div>
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

interface IRadioGroupItemProps {
    value: string;
    svg?: ISVGProps;
    description: string;
    disabled?: boolean;
    className?: string;
    style?: any;
};

const RadioGroupItem = (props: IRadioGroupItemProps) => {
    return (
        <RadioGroup.Item
            data-input-type="radio"
            value={props.value} id={props.value} className={props.className} disabled={props.disabled} style={props.style}>
            {props.description}
        </RadioGroup.Item>
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
            (name: string, type: INoteCreator["type"]) => dispatch(creatorActions.set.build(name, type))
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
            <div className={stylesSettings.session_text} style={{ margin: "0" }}>
                <SVG ariaHidden svg={InfoIcon} />
                <p>{__("settings.annotationCreator.help")}</p>
            </div>
            <div className={stylesInput.form_group} style={{ marginTop: "20px", width: "360px"}}>
                <input type="text" name="creator-name" style={{ width: "100%", marginLeft: "10px" }} className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE" title={name} value={name} onChange={(e) => {
                    const v = e.target.value;
                    setName(v);
                }} />
                <label htmlFor="creator-name">{__("settings.annotationCreator.name")}</label>
            </div>
            <RadioGroup.Root orientation="horizontal" style={{ display: "flex", gap: "10px", marginTop: "20px", flexWrap: "wrap" }}
                value={type}
                onValueChange={(option: "Organization" | "Person") => setType(option)}
            >
                 <p>{__("settings.annotationCreator.type")}</p>
                <RadioGroupItem value="Organization" description={`${__("settings.annotationCreator.organization")}`} className={stylesAnnotations.annotations_filter_tag} />
                <RadioGroupItem value="Person" description={`${__("settings.annotationCreator.person")}`} className={stylesAnnotations.annotations_filter_tag} />
            </RadioGroup.Root>
        </section>
    );
};

const ApiKeys = () => {
    const [__] = useTranslator();

    const [keys, setKeys] = React.useState([]);
    const [inputType, setInputType] = React.useState(["password"]);


    const addNewKey = () => {
        setKeys([...keys, { provider: "", key: "", submitted: false}]);
        setInputType([...inputType, "password"]);
    };

    const updateKey = (index: number, newProvider: string, newKey: string, submitted: boolean) => {
        const updatedKeys = keys.map((k, i) =>
            i === index ? { provider: newProvider, key: newKey, submitted: submitted } : k,
        );
        setKeys(updatedKeys);
    };

    const removeKey = (index: number) => {
        const updatedKeys = keys.filter((_, i) => i !== index);
        setKeys(updatedKeys);
    };

    const updateInputType = (index: number, newType: string) => {
        const updatedType = inputType.map((t, i) =>
            i === index ? newType : t,
        );
        setInputType(updatedType);
    };

    return (
        <section className={stylesSettings.section} style={{ position: "relative" }}>
            <h4>{__("settings.apiKey.title")}</h4>
            <div className={stylesSettings.session_text}>
                <SVG ariaHidden svg={InfoIcon} />
                <p>{__("settings.apiKey.help")}</p>
            </div>
            {keys.map((k, index) => (
                <div key={index} className={stylesSettings.apiKey_container}>
                    <button title={__("settings.apiKey.removeKey")} className={stylesSettings.apiKey_remove_button} onClick={() => removeKey(index)}><SVG ariaHidden svg={QuitIcon} style={{width: "15px"}}/></button>
                    {k.submitted ? 
                    <>
                        <p>{
                        k.provider.includes("OpenAi") ? 
                        <span>
                        <SVG svg={OpenAiIcon} className={classNames(stylesChatbot.provider_logo, stylesChatbot.openai)} />
                        {__("settings.apiKey.openAi")}
                        </span>
                        :
                        <span>
                        <SVG svg={MistralAiIcon} className={classNames(stylesChatbot.provider_logo, stylesChatbot.openai)} />
                        {__("settings.apiKey.mistral")}
                        </span>
                    }</p>
                        <div className={stylesSettings.apiKey_input_submitted}>
                            <input
                            type={inputType[index]}
                            name="api-key"
                            className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE"
                            title={k.provider}
                            value={k.key}
                            disabled
                            
                            />
                            <button type="button" onClick={(e) => {e.preventDefault(); updateInputType(index, inputType[index] === "password" ? "text" : "password");}}>
                                <SVG ariaHidden svg={inputType[index] === "password" ? EyeOpenIcon : EyeClosedIcon} style={{width: "20px"}} />
                            </button>
                        </div>
                    </>
                    :
                    <form>
                    <RadioGroup.Root orientation="horizontal" className={stylesSettings.apiKey_radiogroup}
                        onValueChange={(option) => updateKey(index, option, k.key, false)}
                    >
                        <p>{__("settings.apiKey.providerSelection")}</p>
                        {keys.some((e) => e.provider === "OpenAi" && e.key != k.key) ? <></> : <RadioGroupItem value="OpenAi" description={__("settings.apiKey.openAi")} className={stylesAnnotations.annotations_filter_tag} />}
                        {keys.some((e) => e.provider === "Mistral" && e.key != k.key) ? <></> : <RadioGroupItem value="Mistral" description={__("settings.apiKey.mistral")} className={stylesAnnotations.annotations_filter_tag} />}
                    </RadioGroup.Root>
                    <div className={stylesSettings.apiKey_input_edit_container}>
                        <div className={stylesInput.form_group}>
                            <input
                                type={inputType[index]}
                                name="api-key"
                                className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE"
                                title={k.provider}
                                value={k.key}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    updateKey(index, k.provider, v, false);
                                }}
                                required
                            />
                            <label htmlFor="api-key">{__("settings.apiKey.keyLabel")}</label>
                            <button type="button" onClick={(e) => {e.preventDefault(); updateInputType(index, inputType[index] === "password" ? "text" : "password");}}>
                                <SVG ariaHidden svg={inputType[index] === "password" ? EyeOpenIcon : EyeClosedIcon} style={{width: "20px"}} />
                            </button>
                        </div>
                        <button type="submit" title={__("settings.apiKey.validate")} disabled={k.key.length === 0 || k.provider.length === 0} onClick={(e) => {
                                    e.preventDefault();
                                    updateKey(index, k.provider, k.key, true);
                                }}><SVG ariaHidden svg={k.submitted ? CheckIcon: FloppyDiskIcon} style={{width: "inherit"}} /></button>
                    </div>
                    </form>
                    }
                </div>
            ))}
            {keys.length < 2 ?
            <button onClick={addNewKey} className={stylesButtons.button_primary}><SVG ariaHidden svg={AddIcon} style={{width: "15px"}}/>{__("settings.apiKey.addKey")}</button>
            : <></>
            }
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
            <Dialog.Content className={classNames(stylesModals.modal_dialog)} aria-describedby={undefined}>
                <Tabs.Root defaultValue="tab1" data-orientation="vertical" orientation="vertical" className={stylesSettings.settings_container}>
                    <Tabs.List className={stylesSettings.settings_tabslist} data-orientation="vertical" aria-orientation="vertical">
                        <Tabs.Trigger value="tab1">
                            <SVG ariaHidden svg={CogIcon} />
                            <h3>{__("settings.tabs.general")}</h3>
                        </Tabs.Trigger>
                        <Tabs.Trigger value="tab2">
                            <SVG ariaHidden svg={PaletteIcon} />
                            <h3>{__("settings.tabs.appearance")}</h3>
                        </Tabs.Trigger>
                        <Tabs.Trigger value="tab4">
                            <SVG ariaHidden svg={KeyReturnIcon} />
                            <h3>{__("settings.tabs.keyboardShortcuts")}</h3>
                        </Tabs.Trigger>
                    </Tabs.List>
                    <div className={stylesSettings.settings_content} style={{marginTop: "70px"}}>
                        <Tabs.Content value="tab1" tabIndex={-1}>
                            <TabHeader title={__("settings.tabs.general")} />
                            <div className={stylesSettings.settings_tab}>
                                <LanguageSettings />
                                <ConnectionSettings />
                                <SaveSessionSettings />
                                <ManageAccessToCatalogSettings />
                                <SaveCreatorSettings />
                                <ApiKeys />
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
