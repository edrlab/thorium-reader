// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as stylesPopoverDialog from "readium-desktop/renderer/assets/styles/components/popoverDialog.scss";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Tabs from "@radix-ui/react-tabs";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { ComboBoxItem } from "readium-desktop/renderer/common/components/ComboBox";
import { MySelectProps, Select } from "readium-desktop/renderer/common/components/Select";

import SVG, { ISVGProps } from "readium-desktop/renderer/common/components/SVG";
import * as GuearIcon from "readium-desktop/renderer/assets/icons/gear-icon.svg";
import * as QuitIcon from "readium-desktop/renderer/assets/icons/close-icon.svg";
import * as TextAreaIcon from "readium-desktop/renderer/assets/icons/textarea-icon.svg";
import * as LayoutIcon from "readium-desktop/renderer/assets/icons/layout-icon.svg";
import * as AlignLeftIcon from "readium-desktop/renderer/assets/icons/alignleft-icon.svg";
import * as VolumeUpIcon from "readium-desktop/renderer/assets/icons/volume-icon.svg";
import * as DockLeftIcon from "readium-desktop/renderer/assets/icons/dockleft-icon.svg";
import * as DockRightIcon from "readium-desktop/renderer/assets/icons/dockright-icon.svg";
import * as DockModalIcon from "readium-desktop/renderer/assets/icons/dockmodal-icon.svg";

import classNames from "classnames";
import { IReaderSettingsProps } from "readium-desktop/renderer/reader/components/options-values";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { ReaderConfig } from "readium-desktop/common/models/reader";
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
    const setDockingMode = (value: ReaderConfig["readerDockingMode"]) => {
        setReaderConfig({ readerDockingMode: value });
    };
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

    const sections: Array<React.JSX.Element> = [];
    const options: Array<{ id: number, value: string, name: string, disabled: boolean, svg: {} }> = [];

    const TextTrigger =
        <Tabs.Trigger value="tab-text" disabled={!overridePublisherDefault} title={__("reader.settings.text")} key={"tab-text"} data-value={"tab-text"}>
            <SVG ariaHidden svg={TextAreaIcon} />
            <span>{__("reader.settings.text")}</span>
            {overridePublisherDefault ? <></> : <i>{__("reader.settings.disabled")}</i>}
        </Tabs.Trigger>;
    const optionTextItem = { id: 0, value: "tab-text", name: __("reader.settings.text"), disabled: !overridePublisherDefault, svg: TextAreaIcon };

    const DivinaTrigger =
        <Tabs.Trigger value="tab-divina" disabled={false} title={__("reader.settings.disposition.title")} key={"tab-divina"}>
            <SVG ariaHidden svg={TextAreaIcon} />
            <span>{__("reader.settings.disposition.title")}</span>
        </Tabs.Trigger>;
    const optionDivinaItem = { id: 1, value: "tab-divina", name: __("reader.settings.disposition.title"), disabled: false, svg: TextAreaIcon };

    const SpacingTrigger =
        <Tabs.Trigger value="tab-spacing" disabled={!overridePublisherDefault} key={"tab-spacing"} title={__("reader.settings.spacing")} data-value={"tab-spacing"}>
            <SVG ariaHidden svg={LayoutIcon} />
            <span>{__("reader.settings.spacing")}</span>
            {overridePublisherDefault ? <></> : <i>{__("reader.settings.disabled")}</i>}
        </Tabs.Trigger>;
    const optionSpacingItem = { id: 2, value: "tab-spacing", name: __("reader.settings.spacing"), disabled: !overridePublisherDefault, svg: LayoutIcon };

    const DisplayTrigger =
        <Tabs.Trigger value="tab-display" key={"tab-display"} title={__("reader.settings.display")}>
            <SVG ariaHidden svg={AlignLeftIcon} />
            <span>{__("reader.settings.display")}</span>
        </Tabs.Trigger>;
    const optionDisplayItem = { id: 3, value: "tab-display", name: __("reader.settings.display"), disabled: false, svg: AlignLeftIcon };

    // const AudioTrigger =
    //     <Tabs.Trigger value="tab-audio" key={"tab-audio"} title={__("reader.media-overlays.title")}>
    //         <SVG ariaHidden svg={VolumeUpIcon} />
    //         <p>{__("reader.media-overlays.title")}</p>
    //     </Tabs.Trigger>;
    // const optionAudioItem = { id: 4, value: "tab-audio", name: __("reader.media-overlays.title"), disabled: false, svg: VolumeUpIcon };

    const PdfZoomTrigger =
        <Tabs.Trigger value="tab-pdfzoom" key={"tab-pdfzoom"} title={__("reader.settings.pdfZoom.title")}>
            <SVG ariaHidden svg={VolumeUpIcon} />
            <span>{__("reader.settings.pdfZoom.title")}</span>
        </Tabs.Trigger>;
    const optionPdfZoomItem = { id: 5, value: "tab-pdfzoom", name: __("reader.settings.pdfZoom.title"), disabled: false, svg: VolumeUpIcon };

    const PresetTrigger =
        <React.Fragment key="tab-preset">
            <span style={{ width: "80%", height: "2px", backgroundColor: "var(--color-gray-100)", margin: "10px auto" }}></span>
            <Tabs.Trigger value="tab-preset" disabled={false} title={__("reader.settings.preset.title")} data-value="tab-preset" style={{position: "relative"}}>
                <SVG ariaHidden svg={GuearIcon} />
                <span>{__("reader.settings.preset.title")}</span>
                {diffBetweenDefaultConfigAndConfig ? <span className={stylesSettings.notification_preset}></span> : <></>}
            </Tabs.Trigger>
            <p style={{margin: "-5px 20px 0 60px"}}>{__("reader.settings.preset.detail")}</p>
        </ React.Fragment>;
    const optionPresetItem = { id: 6, value: "tab-preset", name: __("reader.settings.preset.title"), disabled: false, svg: GuearIcon };

    const AllowCustomContainer = () =>
        <div className={stylesSettings.allowCustom} key={"allowCustom"}>
            <AllowCustom />
        </div>;


    if (isDivina) {
        sections.push(DivinaTrigger);
        options.push(optionDivinaItem);
    }
    if (isPdf) {
        sections.push(PdfZoomTrigger);
        options.push(optionPdfZoomItem);
    }
    if (isPdf || isEpub) {
        sections.push(DisplayTrigger);
        options.push(optionDisplayItem);
    }
    if (isEpub) {
        // sections.push(AudioTrigger);
        // options.push(optionAudioItem);
        sections.push(AllowCustomContainer());
        sections.push(TextTrigger);
        options.push(optionTextItem);
        sections.push(SpacingTrigger);
        options.push(optionSpacingItem);
    }
    if (isEpub) {
        sections.push(PresetTrigger);
        options.push(optionPresetItem);
    }


    const setDockingModeFull = () => setDockingMode("full");
    const setDockingModeLeftSide = () => setDockingMode("left");
    const setDockingModeRightSide = () => setDockingMode("right");

    const optionSelected = options.find(({ value }) => value === section)?.id;
    const optionDisabled = options.map(({ id, disabled }) => disabled ? id : -1).filter((v) => v > -1);
    const optionSelectedIsOnOptionDisabled = optionDisabled.includes(optionSelected);
    if (optionSelectedIsOnOptionDisabled) {
        setSection("tab-display");
    }


    // console.log("RENDER");

    const SelectRef = React.forwardRef<HTMLButtonElement, MySelectProps<{ id: number, value: string, name: string, disabled: boolean, svg: {} }>>((props, forwardedRef) => <Select refButEl={forwardedRef} {...props}></Select>);
    SelectRef.displayName = "ComboBox";

    const SelectRefComponent = () => {
        return (
             <SelectRef
                id="reader-settings-nav"
                items={options}
                selectedKey={optionSelected}
                disabledKeys={optionDisabled}
                svg={options.find(({ value }) => value === section)?.svg}
                onSelectionChange={(id) => {
                    // console.log("selectionchange: ", id);
                    const value = options.find(({ id: _id }) => _id === id)?.value;
                    if (value) {
                        setSection(value);
                        setTimeout(() => {
                            // TODO: is stealing focus here necessary? Should this vary depending on keyboard or mouse interaction?
                            const elem = document.getElementById(`readerSettings_tabs-${value}`);
                            elem?.blur();
                            elem?.focus();
                        }, 1);
                        // console.log("set Tab Value = ", value);
                    } else {
                        // console.error("Combobox No value !!!");
                    }
                }}
                // onInputChange={(v) => {
                //     console.log("inputchange: ", v);

                //     const value = options.find(({ name }) => name === v)?.value;
                //     if (value) {
                //         setTabValue(value);
                //         console.log("set Tab Value = ", value);

                //     } else {
                //         console.error("Combobox No value !!!");
                //     }
                // }}
                style={{ margin: "0", padding: (dockedMode && isEpub) ? "10px 0" : "0", flexDirection: "row", backgroundColor: "var(--color-header-docked)" }}
                ref={dockedModeRef}
            >
                {item => <ComboBoxItem>{item.name}</ComboBoxItem>}
            </SelectRef>
        );
    };

    const DockedHeader = () => {
        return (
            <>
                        <div key="docked-header" className={stylesPopoverDialog.docked_header}>
                            {
                                (dockedMode && isEpub) ? <AllowCustomContainer /> : <SelectRefComponent />
                            }
                            <div key="docked-header-btn" className={stylesPopoverDialog.docked_header_controls}>
                                <button className={stylesButtons.button_transparency_icon} disabled={dockingMode === "left" ? true : false} aria-label={__("reader.dock.dockLeft")} onClick={setDockingModeLeftSide}>
                                    <SVG ariaHidden={true} svg={DockLeftIcon} />
                                </button>
                                <button className={stylesButtons.button_transparency_icon} disabled={dockingMode === "right" ? true : false} aria-label={__("reader.dock.dockRight")} onClick={setDockingModeRightSide}>
                                    <SVG ariaHidden={true} svg={DockRightIcon} />
                                </button>
                                <button className={stylesButtons.button_transparency_icon} disabled={false} aria-label={__("reader.dock.dockDefault")} onClick={setDockingModeFull}>
                                    <SVG ariaHidden={true} svg={DockModalIcon} />
                                </button>

                                <Dialog.Close asChild>
                                    <button data-css-override="" className={stylesButtons.button_transparency_icon} aria-label={__("accessibility.closeDialog")}>
                                        <SVG ariaHidden={true} svg={QuitIcon} />
                                    </button>
                                </Dialog.Close>
                            </div>
                        </div>
                        {
                            (dockedMode && isEpub) ? <SelectRefComponent /> : <></>
                        }
                    </>
        );
    };

    const ModalControlButtons = () => {

        return (
            dockedMode ? <></> :
                <div key="modal-header" className={stylesSettings.close_button_div}>
                    <div>
                        <button className={stylesButtons.button_transparency_icon} aria-label={__("reader.dock.dockLeft")} onClick={setDockingModeLeftSide}>
                            <SVG ariaHidden={true} svg={DockLeftIcon} />
                        </button>
                        <button className={stylesButtons.button_transparency_icon} aria-label={__("reader.dock.dockRight")} onClick={setDockingModeRightSide}>
                            <SVG ariaHidden={true} svg={DockRightIcon} />
                        </button>
                        <button className={stylesButtons.button_transparency_icon} disabled aria-label={__("reader.dock.dockDefault")} onClick={setDockingModeFull}>
                            <SVG ariaHidden={true} svg={DockModalIcon} />
                        </button>
                        <Dialog.Close asChild>
                            <button data-css-override="" className={stylesButtons.button_transparency_icon} aria-label={__("accessibility.closeDialog")}>
                                <SVG ariaHidden={true} svg={QuitIcon} />
                            </button>
                        </Dialog.Close>
                    </div>
                </div>
        );
    };
    return (
        <div style={{minHeight: "inherit"}}>
            { dockedMode ? <DockedHeader /> : <></>}
            <Tabs.Root value={section} defaultValue={section} onValueChange={dockedMode ? null : setSection} data-orientation="vertical" orientation="vertical" className={stylesSettings.settings_container}>
                {
                    dockedMode ? <></> :
                    <>
                        <Tabs.List id="reader-settings-nav" ref={tabModeRef} className={stylesSettings.settings_tabslist} aria-orientation="vertical" data-orientation="vertical">
                            {sections}
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
                <ModalControlButtons />
            </Tabs.Root>
        </div>
    );
};
