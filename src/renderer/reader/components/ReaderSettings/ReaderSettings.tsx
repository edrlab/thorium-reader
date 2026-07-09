// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";
import * as React from "react";
import * as Tabs from "@radix-ui/react-tabs";
import * as RadioGroup from "@radix-ui/react-radio-group";

import SVG, { ISVGProps } from "readium-desktop/renderer/common/components/SVG";
import * as GuearIcon from "readium-desktop/renderer/assets/icons/gear-icon.svg";
import * as TextAreaIcon from "readium-desktop/renderer/assets/icons/textarea-icon.svg";
import * as LayoutIcon from "readium-desktop/renderer/assets/icons/layout-icon.svg";
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
import { ReadingSpacing } from "readium-desktop/renderer/reader/components/ReaderSettings/ReadingSpacing";
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


// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends IReaderSettingsProps {
    // handleSettingsClick: (open: boolean) => void;

    // tabValue: string;
    // setTabValue: (value: string) => void;
}

const TabTitle = ({ value }: { value: string }) => {
    let title: string;
    const [__] = useTranslator();

    switch (value) {
        case "tab-divina":
            title = __("reader.settings.disposition.title");
            break;
        case "tab-pdfZoom":
            title = __("reader.settings.disposition.title");
            break;
        case "tab-text":
            title = __("reader.settings.text");
            break;
        case "tab-spacing":
            title = __("reader.settings.spacing");
            break;
        case "tab-display":
            title = __("reader.settings.display");
            break;
        case "tab-audio":
            title = __("reader.media-overlays.title");
            break;
        case "tab-preset":
            title = __("reader.settings.preset.title");
            break;
    }
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

export const RadioGroupItem = (props: IRadioGroupItemProps) => {
    return (
        <RadioGroup.Item
            data-input-type="radio"
            value={props.value} id={props.value} className={classNames(stylesSettings.display_options_item, props.className)} disabled={props.disabled} style={props.style}>
            {props.svg ? <SVG ariaHidden svg={props.svg} /> : <></>}
            {props.description}
        </RadioGroup.Item>
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
    const setSection = (value: string) => {
        setReaderConfig({ readerSettingsSection: value});
    };

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

    const TabItem = [
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
        value: "tab-display",
        name: __("reader.settings.display"),
        disabled: false,
        svg: AlignLeftIcon,
        show: isPdf || isEpub,
    },
    {
        id: 3,
        value: "tab-text",
        name: __("reader.settings.text"),
        disabled: !overridePublisherDefault,
        svg: TextAreaIcon,
        show: isEpub,
        elementBefore: <AllowCustom />,
        extra: !overridePublisherDefault ? <i>{__("reader.settings.disabled")}</i> : null,
    },
    {
        id: 4,
        value: "tab-spacing",
        name: __("reader.settings.spacing"),
        disabled: !overridePublisherDefault,
        svg: LayoutIcon,
        show: isEpub,
        extra: !overridePublisherDefault ? <i>{__("reader.settings.disabled")}</i> : null,
    },
    {
        id: 5,
        value: "tab-preset",
        name: __("reader.settings.preset.title"),
        disabled: false,
        svg: GuearIcon,
        show: isEpub,
        separatorBefore: true,
        extra: diffBetweenDefaultConfigAndConfig ? <span className={stylesSettings.notification_preset}></span> : null,
        subLabel: __("reader.settings.preset.detail"),
    },
];

const visibleTabs = TabItem.filter(tab => tab.show);

const TabTriggers = visibleTabs.flatMap(tab => {
    const elements = [];

    if (tab.separatorBefore) {
        elements.push(
            <span key={`${tab.value}-separator`} style={{ width: "80%", height: "2px", backgroundColor: "var(--color-gray-100)", margin: "10px auto" }} />,
        );
    }

    if (tab.elementBefore) {
        elements.push(
            <div className={stylesSettings.allowCustom} key={"allowCustom"}>
                {tab.elementBefore}
            </div>,
        );
    }

    elements.push(
        <Tabs.Trigger
            key={tab.value}
            value={tab.value}
            data-value={tab.value}
            title={tab.name}
            disabled={tab.disabled}
            style={tab.separatorBefore ? { position: "relative" } : undefined}
        >
            <SVG ariaHidden svg={tab.svg} />
            <span>{tab.name}</span>
            {tab.extra ?? <></>}
        </Tabs.Trigger>,
    );

    if (tab.subLabel) {
        elements.push(
            <p key={`${tab.value}-sublabel`} style={{ margin: "-5px 20px 0 60px" }}>{tab.subLabel}</p>,
        );
    }

    return elements;
});

const options = visibleTabs.map(({ id, value, name, disabled, svg }) => ({ id, value, name, disabled, svg }));

const optionSelected = options.find(({ value }) => value === section)?.id;
const optionDisabled = options.filter(({ disabled }) => disabled).map(({ id }) => id);
const optionSelectedIsOnOptionDisabled = optionDisabled.includes(optionSelected);
if (optionSelectedIsOnOptionDisabled) {
    setSection("tab-display");
}

    // console.log("RENDER");

    return (
        <div style={{minHeight: "inherit"}}>
            { dockedMode ? <DockedHeader dockedMode={dockedMode} dockingMode={dockingMode} isEpub={isEpub} setSection={setSection} dockedModeRef={dockedModeRef} options={options} optionSelected={optionSelected} optionDisabled={optionDisabled} section={section} allowCustomContainer={AllowCustomContainer} /> : <></>}
            <Tabs.Root value={section} defaultValue={section} onValueChange={dockedMode ? null : setSection} data-orientation="vertical" orientation="vertical" className={stylesSettings.settings_container}>
                {
                    dockedMode ? <></> :
                    <>
                        <Tabs.List id="reader-settings-nav" ref={tabModeRef} className={stylesSettings.settings_tabslist} aria-orientation="vertical" data-orientation="vertical">
                            {TabTriggers}
                        </Tabs.List>
                        <TabTitle value={section} />
                    </>
                }
                <div className={stylesSettings.settings_content}
                    style={{ marginTop: dockedMode && "0" }}>
                    <Tabs.Content value="tab-divina" tabIndex={-1} id="readerSettings_tabs-tab-divina" className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE">
                        <div className={stylesSettings.settings_tab}>
                            <DivinaSetReadingMode handleDivinaReadingMode={handleDivinaReadingMode} divinaReadingMode={divinaReadingMode} divinaReadingModeSupported={divinaReadingModeSupported} />
                        </div>
                    </Tabs.Content>
                    <Tabs.Content value="tab-pdfzoom" tabIndex={-1} id="readerSettings_tabs-tab-pdfzoom" className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE">
                        <div className={stylesSettings.settings_tab}>
                            <PdfZoom pdfScale={props.pdfPlayerZoom} /*pdfView={pdfView}*/ />
                        </div>
                    </Tabs.Content>
                    <Tabs.Content value="tab-text" tabIndex={-1} id="readerSettings_tabs-tab-text" className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE">
                        <div className={classNames(stylesSettings.settings_tab, stylesSettings.settings_reading_text, stylesSettings.section)}>
                            <FontSize />
                            <FontFamily />
                        </div>
                    </Tabs.Content>
                    <Tabs.Content value="tab-spacing" tabIndex={-1} id="readerSettings_tabs-tab-spacing" className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE">
                        <div className={stylesSettings.settings_tab}>
                            <ReadingSpacing />
                        </div>
                    </Tabs.Content>
                    <Tabs.Content value="tab-display" tabIndex={-1} id="readerSettings_tabs-tab-display" className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE">
                        <section className={stylesSettings.settings_tab}>
                            {isPdf ? <></> : <Theme dockedMode={dockedMode} />}
                            {isPdf ? <></> : <ReadingDisplayLayout isFXL={props.isFXL} />}
                            {isPdf ? <></> : <ReadingDisplayAlign />}
                            <ReadingDisplayCol isPdf={props.isPdf} pdfCol={props.pdfPlayerSpreadMode === 0 ? "1" : props.pdfPlayerSpreadMode > 0 ? "2" : "1" /* OR "auto" */} spreadModeEven={props.pdfPlayerSpreadMode === 2} />
                            {isPdf ? <></> : <ReadingDisplayCheckboxSettings disableRTLFlip={props.disableRTLFlip} setDisableRTLFlip={props.setDisableRTLFlip} />}
                        </section>
                    </Tabs.Content>
                    <Tabs.Content value="tab-preset" tabIndex={-1} id="readerSettings_tab-preset" className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE">
                        <section className={stylesSettings.settings_tab}>
                            <SaveResetApplyPreset />
                        </section>
                    </Tabs.Content>
                </div>
                <ModalControlButtons dockedMode={dockedMode} />
            </Tabs.Root>
        </div>
    );
};
