// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";
import * as React from "react";
import { Radio as AriaRadio } from "readium-desktop/renderer/common/components/RadioGroupComponent";
import { Tab, TabList, TabPanelOrRegion, TabPanelsOrFragment, Tabs } from "readium-desktop/renderer/common/components/TabsComponent";

import SVG, { ISVGProps } from "readium-desktop/renderer/common/components/SVG";
import * as GuearIcon from "readium-desktop/renderer/assets/icons/gear-icon.svg";
import * as TextAreaIcon from "readium-desktop/renderer/assets/icons/textarea-icon.svg";
import * as AlignLeftIcon from "readium-desktop/renderer/assets/icons/alignleft-icon.svg";
import * as VolumeUpIcon from "readium-desktop/renderer/assets/icons/volume-icon.svg";

import classNames from "classnames";
import { IReaderSettingsProps } from "readium-desktop/renderer/reader/components/options-values";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { useDiffBoolBetweenReaderConfigAndDefaultConfig, useReaderConfig, useSaveReaderConfig } from "readium-desktop/renderer/common/hooks/useReaderConfig";

import { Theme } from "readium-desktop/renderer/reader/components/ReaderSettings/Themes";
import { FontSize } from "readium-desktop/renderer/reader/components/ReaderSettings/FontSize";
import { FontFamily } from "readium-desktop/renderer/reader/components/ReaderSettings/FontFamily";
import ReaderSpacingPresets, { ReaderSpacingAdvanced } from "readium-desktop/renderer/reader/components/ReaderSettings/ReadingSpacing";
import { ReadingDisplayLayout } from "readium-desktop/renderer/reader/components/ReaderSettings/ReadingDisplayLayout";
import { ReadingDisplayCol } from "readium-desktop/renderer/reader/components/ReaderSettings/ReadingDisplayCol";
import { ReadingDisplayAlign } from "readium-desktop/renderer/reader/components/ReaderSettings/ReadingDisplayAlign";
import { ReadingDisplayCheckboxSettings } from "readium-desktop/renderer/reader/components/ReaderSettings/ReadingDisplayCheckboxSettings";
import { DivinaSetReadingMode } from "readium-desktop/renderer/reader/components/ReaderSettings/DivinaSetReadingMode";
import { PdfZoom } from "readium-desktop/renderer/reader/components/ReaderSettings/pdfZoom";
import { AllowCustom } from "readium-desktop/renderer/reader/components/ReaderSettings/AllowCustom";
import { SaveResetApplyPreset } from "readium-desktop/renderer/reader/components/ReaderSettings/SaveResetApplyPreset";
import { ModalControlButtons } from "readium-desktop/renderer/reader/components/ModalControlButtons";
import { DockedHeader } from "readium-desktop/renderer/reader/components/DockedHeader";
import * as AdvancedIcon from "readium-desktop/renderer/assets/icons/advanced-icon.svg";


// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends IReaderSettingsProps {
    // handleSettingsClick: (open: boolean) => void;

    // tabValue: string;
    // setTabValue: (value: string) => void;
}

const TabTitle = ({ value }: { value: string }) => {
    const [__] = useTranslator();
    const titleByTabValue: Record<string, string> = {
        "tab-divina": __("reader.settings.disposition.title"),
        "tab-pdfzoom": __("reader.settings.disposition.title"),
        "tab-text": __("reader.settings.text"),
        "tab-spacing": __("reader.settings.spacing"),
        "tab-display": __("reader.settings.display"),
        "tab-advanced": __("settings.tabs.advanced"),
        "tab-audio": __("reader.media-overlays.title"),
        "tab-preset": __("reader.settings.preset.title"),
    };

    const title = titleByTabValue[value] ?? "";

    return (
        <div className={stylesSettings.settings_tab_title}>
            <h2>{title}</h2>
        </div>
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

interface ITabItem {
    id: number;
    value: string;
    name: string;
    disabled: boolean;
    svg: ISVGProps;
    show: boolean;
    separatorBefore?: boolean;
    extra?: React.ReactNode;
}

export const RadioGroupItem = (props: IRadioGroupItemProps) => {
    return (
        <AriaRadio
            data-input-type="radio"
            value={props.value}
            description={props.description}
            svg={props.svg}
            className={classNames(stylesSettings.display_options_item, props.className)}
            disabled={props.disabled}
            style={props.style}
        />
    );
};

export const ReaderSettings: React.FC<IBaseProps> = (props) => {
    // const { open } = props;
    const { handleDivinaReadingMode, divinaReadingMode, divinaReadingModeSupported } = props;
    // const { tabValue, setTabValue } = props;
    const { isDivina, isPdf } = props;
    const isEpub = !isDivina && !isPdf;
    // const { doFocus } = props;

    const overridePublisherDefault = useSelector((state: IReaderRootState) => state.reader.allowCustomConfig.state);
    const dockingMode = useReaderConfig("readerDockingMode");
    const dockedMode = dockingMode !== "full";
    const setReaderConfig = useSaveReaderConfig();
    const section = useReaderConfig("readerSettingsSection");
    const setSection = React.useCallback((value: string) => {
        setReaderConfig({ readerSettingsSection: value });
    }, [setReaderConfig]);
    const [isSpacingAdvancedOpen, setIsSpacingAdvancedOpen] = React.useState(false);

    const diffBetweenDefaultConfigAndConfig = useDiffBoolBetweenReaderConfigAndDefaultConfig();

    const [__] = useTranslator();

    // const [
    //     transcientStateOverridePublisherDefault,
    //     setTranscientStateOverridePublisherDefault,
    // ] = React.useState<ReaderConfig>(readerConfig);

    // TODO none of these PDF states persist!! (very noticeable with the checkbox which is always reset to false / unticked)

    // const [pdfScale, setPdfScale] = React.useState<IState["pdfScale"]>(props.pdfPlayerZoom as IPdfPlayerScale);
    // const [pdfCol, setPdfCol] = React.useState<IState["pdfCol"]>(props.pdfPlayerSpreadMode === 0 ? "1" : props.pdfPlayerSpreadMode > 0 ? "2" : "1" /* OR "auto" */);
    // const [pdfView, setPdfView] = React.useState<IState["pdfView"]>("scrolled"); // never changed always scrolled // so let's comment it for the moment
    // const [pdfSpreadModeEven, setPdfSpreadModeEven] = React.useState<IState["spreadModeEven"]>(props.pdfPlayerSpreadMode === 2);

    // React.useEffect(() => {
    //     // console.log("React.useEffect setPdfState");

    //     createOrGetPdfEventBus().subscribe("view", setPdfView);
    //     createOrGetPdfEventBus().subscribe("scale", setPdfScale);
    //     createOrGetPdfEventBus().subscribe("column", setPdfCol);
    //     createOrGetPdfEventBus().subscribe("spreadModeEven", setPdfSpreadModeEven);

    //     return () => {
    //         createOrGetPdfEventBus().remove(setPdfScale, "scale");
    //         // createOrGetPdfEventBus().remove(setPdfView, "view");
    //         createOrGetPdfEventBus().remove(setPdfCol, "column");
    //         createOrGetPdfEventBus().remove(setPdfSpreadModeEven , "spreadModeEven");
    //     };
    // }, [setPdfScale, /*setPdfView,*/ setPdfCol, setPdfSpreadModeEven]);

    // TODO: transform it to a saga logic, triggered by allowCustomCheckbox
    // const setPartialSettingsDebounced = React.useMemo(() => {
    //     const saveConfig = (config: Partial<ReaderConfig>, override = true) => {
    //         if (override) {
    //             setTranscientStateOverridePublisherDefault({
    //                 font: config.font || transcientStateOverridePublisherDefault.font || readerConfig.font,
    //                 fontSize: config.fontSize || transcientStateOverridePublisherDefault.fontSize || readerConfig.fontSize,
    //                 pageMargins: config.pageMargins || transcientStateOverridePublisherDefault.pageMargins || readerConfig.pageMargins,
    //                 wordSpacing: config.wordSpacing || transcientStateOverridePublisherDefault.wordSpacing || readerConfig.wordSpacing,
    //                 letterSpacing: config.letterSpacing || transcientStateOverridePublisherDefault.letterSpacing || readerConfig.letterSpacing,
    //                 paraSpacing: config.paraSpacing || transcientStateOverridePublisherDefault.paraSpacing || readerConfig.paraSpacing,
    //                 lineHeight: config.lineHeight || transcientStateOverridePublisherDefault.lineHeight || readerConfig.lineHeight,
    //             });
    //         }
    //         dispatch(readerLocalActionSetConfig.build({ ...readerConfig, ...config }));
    //     };
    //     return debounce(saveConfig, 400);
    // }, [transcientStateOverridePublisherDefault, readerConfig, dispatch]);

    // React.useEffect(() => {
    //     setPartialSettingsDebounced.clear();
    //     return () => setPartialSettingsDebounced.flush();
    // }, [setPartialSettingsDebounced]);


    // const [tabValue, setTabValue] = React.useState(isDivina ? "tab-divina" : isPdf ? "tab-pdfzoom" : "tab-display");

    // React.useEffect(() => {
    //     let ov = false;
    //     for (const [key, value] of Object.entries(readerConfigInitialStateDefaultPublisher)) {
    //         if (readerConfig[key as keyof typeof readerConfigInitialState] === value) continue;
    //         else {
    //             ov = true;
    //             break;
    //         }
    //     }
    //     setOverride(ov);
    // }, [readerConfig]);

    // const setAllowCustomCheckbox = React.useMemo(() => () => {
    //     if (overridePublisherDefault) {
    //         setPartialSettingsDebounced(readerConfigInitialStateDefaultPublisher, false);
    //         setTabValue("tab-display");
    //         setOverridePublisherDefault(false);
    //     } else {
    //         setOverridePublisherDefault(true);
    //         setTabValue("tab-text");
    //         setPartialSettingsDebounced(transcientStateOverridePublisherDefault);
    //     }
    // }, [overridePublisherDefault, transcientStateOverridePublisherDefault]);

    const dockedModeRef = React.useRef<HTMLButtonElement>();
    const tabModeRef = React.useRef<HTMLDivElement>();
    // React.useEffect(() => {
    //     console.log("ReaderSettings UPDATED");

    //     if (dockingMode !== "full") {

    //         setTimeout(() => {
    //             if (dockedModeRef.current) {
    //                 // TODO: is stealing focus here necessary? The logic here does not even check doFocus which is in the dependency array! Should this vary depending on keyboard or mouse interaction?
    //                 console.log("Focus on docked mode combobox");
    //                 dockedModeRef.current.focus();
    //             } else {
    //                 console.error("!no dockedModeRef on combobox");
    //             }
    //         }, 1);

    //     }

    // }, [dockingMode, doFocus]);

    const AllowCustomContainer = () =>
        <div className={stylesSettings.allowCustom} key={"allowCustom"}>
            <AllowCustom />
        </div>;

    const tabItems = React.useMemo<ITabItem[]>(() => [
        {
            id: 0,
            value: "tab-divina",
            name: __("reader.settings.disposition.title"),
            disabled: false,
            svg: TextAreaIcon,
            show: isDivina,
        },
        {
            id: 1,
            value: "tab-pdfzoom",
            name: __("reader.settings.pdfZoom.title"),
            disabled: false,
            svg: VolumeUpIcon,
            show: isPdf,
        },
        {
            id: 2,
            value: "tab-text",
            name: __("reader.settings.text"),
            disabled: false,
            svg: TextAreaIcon,
            show: isEpub,
        },
        {
            id: 3,
            value: "tab-display",
            name: __("reader.settings.display"),
            disabled: false,
            svg: AlignLeftIcon,
            show: isPdf || isEpub,
        },
        {
            id: 4,
            value: "tab-advanced",
            name: __("settings.tabs.advanced"),
            disabled: false,
            svg: AdvancedIcon,
            show: isEpub,
        },
        {
            id: 5,
            value: "tab-preset",
            name: __("reader.settings.preset.title"),
            disabled: false,
            svg: GuearIcon,
            show: isEpub,
            separatorBefore: true,
            extra: diffBetweenDefaultConfigAndConfig ? <span className={stylesSettings.notification_preset}></span> : undefined,
        },
    ], [__, diffBetweenDefaultConfigAndConfig, isDivina, isEpub, isPdf]);

    const visibleTabs = React.useMemo(() => tabItems.filter((tab) => tab.show), [tabItems]);

    const tabTriggers = React.useMemo(() => visibleTabs.map((tab) => (
        <Tab
            key={tab.value}
            id={tab.value}
            data-focus-id={tab.value === section ? "reader-settings-nav" : undefined}
            data-separator-before={tab.separatorBefore || undefined}
            data-value={tab.value}
            isDisabled={tab.disabled}
        >
            <SVG ariaHidden svg={tab.svg} />
            <span>{tab.name}</span>
            {tab.extra ?? null}
        </Tab>
    )), [section, visibleTabs]);

    const options = React.useMemo(() => (
        visibleTabs.map(({ id, value, name, disabled, svg }) => ({ id, value, name, disabled, svg }))
    ), [visibleTabs]);

    const optionLabelsByValue = React.useMemo(() => (
        new Map(options.map((option) => [option.value, option.name]))
    ), [options]);

    const getOptionLabel = React.useCallback((value: string) => (
        optionLabelsByValue.get(value) ?? ""
    ), [optionLabelsByValue]);

    const optionSelected = options.find(({ value }) => value === section)?.id;
    const optionDisabled = options.filter(({ disabled }) => disabled).map(({ id }) => id);

    React.useEffect(() => {
        if (optionSelected !== undefined && optionDisabled.includes(optionSelected)) {
            setSection("tab-display");
        }
    }, [optionDisabled, optionSelected, setSection]);

    // console.log("RENDER");

    return (
        <div style={{ minHeight: "inherit" }}>
            {dockedMode && (
                <DockedHeader dockedMode={dockedMode} dockingMode={dockingMode} isEpub={isEpub} setSection={setSection} dockedModeRef={dockedModeRef} options={options} optionSelected={optionSelected} optionDisabled={optionDisabled} section={section} allowCustomContainer={AllowCustomContainer} panel={"settings"} />
            )}
            <Tabs selectedKey={section} onSelectionChange={(key) => dockedMode ? undefined : setSection(key.toString())} data-orientation="vertical" orientation="vertical" className={stylesSettings.settings_container}>
                {!dockedMode && (
                    <>
                        <div className={stylesSettings.settings_tabslist}>
                            <TabList aria-label={__("reader.navigation.settingsTitle")} ref={tabModeRef} aria-orientation="vertical" data-orientation="vertical">
                                {tabTriggers}
                            </TabList>
                        </div>
                        <TabTitle value={section} />
                    </>
                )}
                <div className={stylesSettings.settings_content}
                    style={{ marginTop: dockedMode && "0" }}>
                    <TabPanelsOrFragment dockedMode={dockedMode}>
                    <TabPanelOrRegion id="tab-divina" focusId="readerSettings_tabs-tab-divina" selectedKey={section} dockedMode={dockedMode} label={getOptionLabel("tab-divina")} className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE">
                        <div className={stylesSettings.settings_tab}>
                            <DivinaSetReadingMode handleDivinaReadingMode={handleDivinaReadingMode} divinaReadingMode={divinaReadingMode} divinaReadingModeSupported={divinaReadingModeSupported} />
                        </div>
                    </TabPanelOrRegion>
                    <TabPanelOrRegion id="tab-pdfzoom" focusId="readerSettings_tabs-tab-pdfzoom" selectedKey={section} dockedMode={dockedMode} label={getOptionLabel("tab-pdfzoom")} className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE">
                        <div className={stylesSettings.settings_tab}>
                            <PdfZoom pdfScale={props.pdfPlayerZoom} /*pdfView={pdfView}*/ />
                        </div>
                    </TabPanelOrRegion>
                    <TabPanelOrRegion id="tab-text" focusId="readerSettings_tabs-tab-text" selectedKey={section} dockedMode={dockedMode} label={getOptionLabel("tab-text")} className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE">
                        <section className={stylesSettings.settings_tab}>
                            <h3>{__("reader.settings.font")}</h3>
                            <section className={stylesSettings.settings_display_section}>
                                <FontSize overridePublisherDefault={overridePublisherDefault} />
                                <FontFamily overridePublisherDefault={overridePublisherDefault} />
                            </section>
                            {!isPdf && 
                            <>
                            <h3>{__("reader.settings.justification")}</h3>
                            <section className={stylesSettings.settings_display_section}>
                                <ReadingDisplayAlign overridePublisherDefault={overridePublisherDefault} />
                            </section>
                            </>
                            }
                           
                            <h3 style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                {__("reader.settings.spacing")}
                                <button onClick={() => { setIsSpacingAdvancedOpen((isOpen) => !isOpen); }}>
                                    <SVG aria-hidden svg={GuearIcon} />
                                </button>
                            </h3>
                            <section className={stylesSettings.settings_display_section}>
                            {isSpacingAdvancedOpen ? <ReaderSpacingAdvanced overridePublisherDefault={overridePublisherDefault} /> : <ReaderSpacingPresets overridePublisherDefault={overridePublisherDefault} />}
                            </section>
                            <AllowCustomContainer />
                        </section>
                    </TabPanelOrRegion>
                    <TabPanelOrRegion id="tab-display" focusId="readerSettings_tabs-tab-display" selectedKey={section} dockedMode={dockedMode} label={getOptionLabel("tab-display")} className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE">
                        <section className={stylesSettings.settings_tab}>
                            {!isPdf && (
                                <>
                                    <h3>{__("reader.settings.theme.title")}</h3>
                                    <Theme dockedMode={dockedMode} />
                                </>
                            )}
                            {!isPdf && 
                            <>
                                <h3>{__("reader.settings.disposition.title")}</h3>
                                <ReadingDisplayLayout isFXL={props.isFXL} />
                            </>
                            }
                            <h3>{__("reader.settings.column.title")}</h3>
                            <ReadingDisplayCol isPdf={props.isPdf} pdfCol={props.pdfPlayerSpreadMode === 0 ? "1" : props.pdfPlayerSpreadMode > 0 ? "2" : "1" /* OR "auto" */} spreadModeEven={props.pdfPlayerSpreadMode === 2} />
                        </section>
                    </TabPanelOrRegion>
                    {!isPdf && (
                        <TabPanelOrRegion id="tab-advanced" focusId="readerSettings_tabs-tab-advanced" selectedKey={section} dockedMode={dockedMode} label={getOptionLabel("tab-advanced")} className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE">
                            <section className={stylesSettings.settings_tab}>
                                <ReadingDisplayCheckboxSettings disableRTLFlip={props.disableRTLFlip} setDisableRTLFlip={props.setDisableRTLFlip} />
                            </section>
                        </TabPanelOrRegion>
                    )}
                    <TabPanelOrRegion id="tab-preset" focusId="readerSettings_tabs-tab-preset" selectedKey={section} dockedMode={dockedMode} label={getOptionLabel("tab-preset")} className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE">
                        <section className={stylesSettings.settings_tab}>
                            <SaveResetApplyPreset />
                        </section>
                    </TabPanelOrRegion>
                    </TabPanelsOrFragment>
                </div>
                <ModalControlButtons dockedMode={dockedMode} />
            </Tabs>
        </div>
    );
};
