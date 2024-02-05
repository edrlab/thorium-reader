// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Tabs from "@radix-ui/react-tabs";
import * as RadioGroup from "@radix-ui/react-radio-group";
import classNames from "classnames";
import * as QuitIcon from "readium-desktop/renderer/assets/icons/close-icon.svg";
import * as TextAreaIcon from "readium-desktop/renderer/assets/icons/textarea-icon.svg";
import * as LayoutIcon from "readium-desktop/renderer/assets/icons/layout-icon.svg";
import * as AlignLeftIcon from "readium-desktop/renderer/assets/icons/alignleft-icon.svg";
import * as VolumeUpIcon from "readium-desktop/renderer/assets/icons/volume-icon.svg";
import * as SwatchesIcon from "readium-desktop/renderer/assets/icons/swatches-icon.svg";
import * as ScrollableIcon from "readium-desktop/renderer/assets/icons/scroll-icon.svg";
import * as PaginatedIcon from "readium-desktop/renderer/assets/icons/page-icon.svg";
import * as TwoColsIcon from "readium-desktop/renderer/assets/icons/2cols-icon.svg";
import * as AlignAutoIcon from "readium-desktop/renderer/assets/icons/align-auto-icon.svg";
import * as AlignJustifyIcon from "readium-desktop/renderer/assets/icons/align-justify-icon.svg";
import * as DockLeftIcon from "readium-desktop/renderer/assets/icons/dockleft-icon.svg";
import * as DockRightIcon from "readium-desktop/renderer/assets/icons/dockright-icon.svg";
import * as DockModalIcon from "readium-desktop/renderer/assets/icons/dockmodal-icon.svg";
// import * as AlignLefttIcon from "readium-desktop/renderer/assets/icons/alignleft-icon.svg";
import * as DoneIcon from "readium-desktop/renderer/assets/icons/done.svg";
import SVG, { ISVGProps } from "readium-desktop/renderer/common/components/SVG";
import { IPdfPlayerColumn, IPdfPlayerScale, IPdfPlayerView } from "../pdf/common/pdfReader.type";
import { IPopoverDialogProps, IReaderSettingsProps } from "./options-values";
import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import { ComboBox, ComboBoxItem } from "readium-desktop/renderer/common/components/ComboBox";
import { ReaderConfig } from "readium-desktop/common/models/reader";
import * as stylesReader from "readium-desktop/renderer/assets/styles/reader-app.scss";
import debounce from "debounce";
import fontList from "readium-desktop/utils/fontList";
import { readerConfigInitialState, readerConfigInitialStateDefaultPublisher } from "readium-desktop/common/redux/states/reader";
import * as stylesPopoverDialog from "readium-desktop/renderer/assets/styles/components/popoverDialog.scss";
import { createOrGetPdfEventBus } from "../pdf/driver";
import { MySelectProps, Select } from "readium-desktop/renderer/common/components/Select";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends IReaderSettingsProps, IPopoverDialogProps {
    handleSettingsClick: (open: boolean) => void;
}

interface IState {
    pdfScale?: IPdfPlayerScale | undefined;
    pdfView?: IPdfPlayerView | undefined;
    pdfCol?: IPdfPlayerColumn | undefined;
}

const TabTitle = ({title}: {title: string}) => {
    return (
        <div className={stylesSettings.settings_tab_title}>
            <h2>{title}</h2>
        </div>
    );
};

const Theme = ({theme, set}: {theme: Pick<ReaderConfig, "night" | "sepia">, set: (a: Pick<ReaderConfig, "night" | "sepia">) => void}) => {
    const [__] = useTranslator();
    const [options] = React.useState(() => [
        {
            id: 1,
            name: `${__("reader.settings.theme.name.Neutral")}`,
            value: "neutral",
        },
        {
            id: 2,
            name: `${__("reader.settings.theme.name.Sepia")}`,
            value: "sepia",
        },
        {
            id: 3,
            name: `${__("reader.settings.theme.name.Night")}`,
            value: "night",
        },
    ]);

    const defaultKey = theme.night ? 3 : theme.sepia ? 2 : 1;

    return (
        <ComboBox label={__("reader.settings.theme.title")} defaultItems={options} defaultSelectedKey={defaultKey} onSelectionChange={(key: React.Key) => {
            set({
                night: key === 3,
                sepia: key === 2,
            });
        }} svg={SwatchesIcon}>
            {item => <ComboBoxItem>{item.name}</ComboBoxItem>}
        </ComboBox>
    );
};

export const FontSize = ({config: {fontSize}, set}: {config: Pick<ReaderConfig, "fontSize">, set: (a: Pick<ReaderConfig, "fontSize">) => void}) => {
    const [__] = useTranslator();

    const [currentSliderValue, setCurrentSliderValue] = React.useState(fontSize.replace(/%/g, ""));

    const click = (direction: string) => {
        const step = 12.5;
        let newStepValue: number;

        if (direction === "out") {
            newStepValue = Number(currentSliderValue.replace(/%/g, "")) - step;
        } else {
            newStepValue = Number(currentSliderValue.replace(/%/g, "")) + step;
        }
        const clampedValue = Math.min(Math.max(newStepValue, 75), 250);
        const valueToString = clampedValue.toFixed(1);
        setCurrentSliderValue(valueToString);
        set({ fontSize: valueToString + "%" });
    };

    return (
        <section>
            <h4>{__("reader.settings.fontSize")} ({fontSize})</h4>
            <div className={stylesSettings.size_range}>
                <button onClick={() => click("out")} className={stylesSettings.scale_button}><span>-</span></button>
                <input
                    type="range"
                    aria-labelledby="label_fontSize"
                    min={75}
                    max={250}
                    step={12.5}
                    aria-valuemin={0}
                    value={currentSliderValue}
                    onChange={(e) => {
                        const newValue = e.target?.value || "100";
                        setCurrentSliderValue(newValue);
                        set({ fontSize: newValue + "%" });
                    }
                    }
                />
                <button onClick={() => click("in")} className={stylesSettings.scale_button}><span>+</span></button>
            </div>
        </section>
    );
};

export const FontFamily = ({config: {font}, set}: {config: Pick<ReaderConfig, "font">, set: (a: Pick<ReaderConfig, "font">) => void}) => {
    const [__] = useTranslator();

    const options = fontList.map((fontItem, id) => ({ id, value: fontItem.id, name: fontItem.label, fontFamily: fontItem.fontFamily }));
    // if (fontList.findIndex((v) => v.id === font) < 0) {
    //     options.push({
    //         id: fontList.length,
    //         value: font,
    //         name: font,
    //         fontFamily: `${font}, Consolas, monospace`,
    //     });
    // }

    // console.log(options);
    const selected = options.find((v) => v.value === font) || {
        id: fontList.length,
        value: font,
        name: font,
        fontFamily: `${font}, Consolas, monospace`,
    };
    // console.log(selected);

    const defaultkey = selected.id;
    const fontFamily = selected.fontFamily;
    const fontName = selected.name;

    const [inputval, setInputval] = React.useState(fontName);

    const saveFont = (value: string) => {
        let val = value.trim();
        // a"b:c    ;d;<e>f'g&h
        val = val.
            replace(/\t/g, "").
            replace(/"/g, "").
            replace(/:/g, "").
            replace(/'/g, "").
            replace(/;/g, "").
            replace(/</g, "").
            replace(/>/g, "").
            replace(/\\/g, "").
            replace(/\//g, "").
            replace(/&/g, "").
            replace(/\n/g, " ").
            replace(/\s\s+/g, " ");
        if (!val) { // includes empty string (falsy)
            val = undefined;
        }
        set({ font: val });
    };

    return (
        <div>
            <ComboBox label={__("reader.settings.font")} defaultItems={options} selectedKey={defaultkey}
                onSelectionChange={
                    (key: React.Key) => {
                        // console.log("@@@@@");
                        // console.log("@@@@@");
                        // console.log(key);
                        // console.log("@@@@@");
                        // console.log("@@@@@");

                        if (key === null) {
                            const notFound = !options.find((v) => v.name === inputval);
                            // console.log("fontList save notFound=", notFound);
                            if (notFound) saveFont(inputval);
                        } else {
                            const found = options.find((v) => v.id === key);
                            // console.log("fontList save ",found.value);
                            saveFont(found.value);
                        }
                    }}
                svg={TextAreaIcon}
                allowsCustomValue
                onInputChange={(v) => setInputval(v)}
            >
                {item => <ComboBoxItem>{item.name}</ComboBoxItem>}
            </ComboBox>
            <span
                aria-hidden
                style={{
                    fontSize: "1.4em",
                    lineHeight: "1.2em",
                    display: "block",
                    marginTop: "0.84em",
                    marginBottom: "0.5em",
                    fontFamily,
                }}>{fontName}
            </span>
        </div>
    );
};

interface ITable {
    title: string,
    ariaLabel: string,
    min: number,
    max: number,
    step: number,
    ariaValuemin: number,
    defaultValue: string,
    parameter: "pageMargins" | "wordSpacing" | "letterSpacing" | "paraSpacing" | "lineHeight",
    altParameter: string,
    rem: boolean,
}

const Slider = ({ option, set }: { option: ITable, set: (a: Pick<ReaderConfig, "pageMargins" | "wordSpacing" | "letterSpacing" | "paraSpacing" | "lineHeight">) => void }) => {
    const [currentSliderValue, setCurrentSliderValue] = React.useState(option.defaultValue);

    const click = (direction: string) => {
        const step = option.step;
        let newStepValue: number;

        if (direction === "out") {
            newStepValue = Number(currentSliderValue.replace(/rem/g, "")) - step;
        } else {
            newStepValue = Number(currentSliderValue.replace(/rem/g, "")) + step;
        }
        const clampedValue = Math.min(Math.max(newStepValue, option.min), option.max);
        const valueToString = clampedValue.toFixed(2);
        setCurrentSliderValue(valueToString);
        set({ [option.parameter]: valueToString + (option.rem ? "rem" : "") } as Pick<ReaderConfig, "pageMargins" | "wordSpacing" | "letterSpacing" | "paraSpacing" | "lineHeight">);
    };

    return (
        <section className={stylesSettings.section} key={option.title}>
            <div className={stylesSettings.spacing_heading}>
                <h4>{option.title}</h4>
                <p>{currentSliderValue + (option.rem ? "rem" : "")}</p>
            </div>
            <div className={stylesSettings.size_range}>
                <button onClick={() => click("out")} className={stylesSettings.scale_button}>-</button>
                <input
                    id={option.title}
                    type="range"
                    aria-labelledby={option.ariaLabel}
                    min={option.min}
                    max={option.max}
                    step={option.step}
                    aria-valuemin={option.ariaValuemin}
                    value={currentSliderValue}
                    onChange={(e) => {
                        const newValue = e.target.value;
                        setCurrentSliderValue(newValue);
                        set({ [option.parameter]: newValue + (option.rem ? "rem" : "") } as Pick<ReaderConfig, "pageMargins" | "wordSpacing" | "letterSpacing" | "paraSpacing" | "lineHeight">);
                    }}
                />
                <button onClick={() => click("in")} className={stylesSettings.scale_button}>+</button>
            </div>
        </section>
    );
};


const ReadingSpacing = ({config: {pageMargins, wordSpacing, letterSpacing, paraSpacing, lineHeight}, set }: {config: ReaderConfig, set: (a: Pick<ReaderConfig, "pageMargins" | "wordSpacing" | "letterSpacing" | "paraSpacing" | "lineHeight">) => void }) => {

    const [__] = useTranslator();

    const spacingOptions: ITable[] = [
        {
            title: `${__("reader.settings.margin")}`,
            ariaLabel: "label_pageMargins",
            min: 0.5,
            max: 2,
            step: 0.25,
            ariaValuemin: 0,
            defaultValue: pageMargins,
            parameter: "pageMargins",
            altParameter: `${readerConfigInitialState.pageMargins}`,
            rem: false,
        },
        {
            title: `${__("reader.settings.wordSpacing")}`,
            ariaLabel: "label_wordSpacing",
            min: 0.05,
            max: 1,
            step: 0.05,
            ariaValuemin: 0,
            defaultValue: wordSpacing,
            parameter: "wordSpacing",
            altParameter: `${readerConfigInitialState.wordSpacing}`,
            rem: true,
        },
        {
            title: `${__("reader.settings.letterSpacing")}`,
            ariaLabel: "label_letterSpacing",
            min: 0.05,
            max: 0.5,
            step: 0.05,
            ariaValuemin: 0,
            defaultValue: letterSpacing,
            parameter: "letterSpacing",
            altParameter: `${readerConfigInitialState.letterSpacing}`,
            rem: true,
        },
        {
            title: `${__("reader.settings.paraSpacing")}`,
            ariaLabel: "label_paraSpacing",
            min: 0.5,
            max: 3,
            step: 0.5,
            ariaValuemin: 0,
            defaultValue: paraSpacing,
            parameter: "paraSpacing",
            altParameter: `${readerConfigInitialState.paraSpacing}`,
            rem: true,
        },
        {
            title: `${__("reader.settings.lineSpacing")}`,
            ariaLabel: "label_lineHeight",
            min: 0.5,
            max: 3,
            step: 0.5,
            ariaValuemin: 0,
            defaultValue: lineHeight,
            parameter: "lineHeight",
            altParameter: `${readerConfigInitialState.lineHeight}`,
            rem: true,
        },
    ];

    return (
        <div className={stylesSettings.settings_tab_container_reading_spacing}>
            {spacingOptions.map((option: ITable) => (
                <Slider option={option} key={option.title} set={set}/>
            ))}
        </div>
    );

};

interface IRadioGroupItemProps {
    value: string;
    svg: ISVGProps;
    description: string;
    disabled: boolean;
};

const RadioGroupItem = (props: IRadioGroupItemProps) => {
    return (
        <RadioGroup.Item value={props.value} id={props.value} className={stylesSettings.display_options_item} disabled={props.disabled}>
            <SVG ariaHidden svg={props.svg} />
            {props.description}
        </RadioGroup.Item>
    );
};

const ReadingDisplayLayout = ({config: {paged: layout}, set}: {config: Pick<ReaderConfig, "paged">, set: (a: Pick<ReaderConfig, "paged">) => void}) => {
    const [__] = useTranslator();
    return (
        <div className={stylesSettings.section}>
            <h4>{__("reader.settings.disposition.title")}</h4>
            <div className={stylesSettings.display_options}>
                <RadioGroup.Root orientation="horizontal" style={{ display: "flex" }} value={layout ? "page_option" : "scroll_option"}
                    onValueChange={(v) => set({ paged: v === "page_option" })}
                >
                    <RadioGroupItem value="scroll_option" description={`${__("reader.settings.scrolled")}`} svg={ScrollableIcon} disabled={false}/>
                    <RadioGroupItem value="page_option" description={`${__("reader.settings.paginated")}`} svg={PaginatedIcon} disabled={false}/>
                </RadioGroup.Root>
            </div>
        </div>
    );
};

const ReadingDisplayCol = ({ config: { paged, colCount }, set, isPdf, pdfCol }: { config: Pick<ReaderConfig, "paged" | "colCount">, set: (a: Pick<ReaderConfig, "colCount">) => void, isPdf: boolean } & Pick<IBaseProps, "isPdf"> & Pick<IState, "pdfCol">) => {
    const [__] = useTranslator();
    const scrollable = !paged;

    const [state, setState] = React.useState(scrollable ? "auto" : colCount);
    React.useEffect(() => {
        scrollable ? setState("auto") : setState(colCount);
    }, [scrollable, colCount]);

    return (
        <section className={stylesSettings.section}>
            <div>
                <h4>{__("reader.settings.column.title")}</h4>
            </div>
            <div className={stylesSettings.display_options}>
                <RadioGroup.Root orientation="horizontal" style={{ display: "flex" }} value={isPdf ? pdfCol : state}
                    onValueChange={(v) => {
                        isPdf ? createOrGetPdfEventBus().dispatch("column", v === "auto" ? "1" : v === "1" ? "1" : "2") : set({ colCount: v });}}
                    >
                        {isPdf ? <></> : <RadioGroupItem value="auto" description={`${__("reader.settings.column.auto")}`} svg={AlignJustifyIcon} disabled={false} />}
                        <RadioGroupItem value="1" description={`${__("reader.settings.column.one")}`} svg={AlignJustifyIcon} disabled={isPdf ? false : scrollable} />
                        <RadioGroupItem value="2" description={`${__("reader.settings.column.two")}`} svg={TwoColsIcon} disabled={isPdf ? false : scrollable} />
                </RadioGroup.Root>
            </div>
        </section>
    );
};

const ReadingDisplayAlign = ({ config: { align }, set }: { config: Pick<ReaderConfig, "align">, set: (a: Pick<ReaderConfig, "align">) => void }) => {
    const [__] = useTranslator();

    return (
        <section className={stylesSettings.section}>
            <div>
                <h4>{__("reader.settings.justification")}</h4>
            </div>
            <div className={stylesSettings.display_options}>
            <RadioGroup.Root orientation="horizontal" style={{ display: "flex" }} value={align}
                    onValueChange={(v) => set({align: v})}
                >
                    <RadioGroupItem value="auto" description={`${__("reader.settings.column.auto")}`} svg={AlignAutoIcon} disabled={false} />
                    <RadioGroupItem value="justify" description={`${__("reader.settings.justify")}`} svg={AlignJustifyIcon} disabled={false} />
                    <RadioGroupItem value="start" description={`${__("reader.svg.left")}`} svg={AlignLeftIcon} disabled={false} />
            </RadioGroup.Root>
            </div>
        </section>
    );
};

const ReadingAudio = ({ config: { mediaOverlaysEnableCaptionsMode: captions, mediaOverlaysEnableSkippability: skippability, ttsEnableSentenceDetection: splitTTStext }, set }:
    { config: Pick<ReaderConfig, "mediaOverlaysEnableCaptionsMode" | "mediaOverlaysEnableSkippability" | "ttsEnableSentenceDetection">,
    set: (a: Partial<Pick<ReaderConfig, "mediaOverlaysEnableCaptionsMode" | "mediaOverlaysEnableSkippability" | "ttsEnableSentenceDetection">>) => void }) => {
    const [__] = useTranslator();

    const options = [
        {
            id: "captions",
            name: "Captions",
            label: `${__("reader.media-overlays.captions")}`,
            description: "Mauris aliquet ligula ac augue aliquet sollicitudin. Nunc eget hendrerit lectus.",
            checked: captions,
            onChange: () => {
                set({ mediaOverlaysEnableCaptionsMode: !captions });
            },
        },
        {
            id: "skippability",
            name: "Skippability",
            label: `${__("reader.media-overlays.skip")}`,
            description: "Ut ex justo, rhoncus vitae magna eget, fringilla ullamcorper ligula.",
            checked: skippability,
            onChange: () => {
                set({ mediaOverlaysEnableSkippability: !skippability });
            },
        },
        {
            id: "splitTTStext",
            name: "splitTTStext",
            label: `${__("reader.tts.sentenceDetect")}`,
            description: "Nunc at purus ut mauris tincidunt egestas non at velit. In dolor massa, commodo at diam a, dictum faucibus sem.",
            checked: splitTTStext,
            onChange: () => {
                set({ ttsEnableSentenceDetection: !splitTTStext });
            },
        },
    ];

    return (
        <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px,1fr)", gap: "30px"}}>
            {options.map((option) => (
                <section className={stylesSettings.section} key={option.id}>
                    <div>
                        <input
                            id={option.id}
                            type="checkbox"
                            name={option.name}
                            onChange={option.onChange}
                            defaultChecked={option.checked}
                        />
                        <label htmlFor={option.id}>{option.label}</label>
                        <p className={stylesSettings.session_text}>{option.description}</p>
                    </div>
                </section>

            ))}
        </div>
    );
};

const ReadingDisplayMathJax = ({ config: { enableMathJax, reduceMotion, noFootnotes }, set }:
    { config: Pick<ReaderConfig, "enableMathJax" | "reduceMotion" | "noFootnotes">,
    set: (a: Partial<Pick<ReaderConfig, "enableMathJax" | "reduceMotion" | "noFootnotes" | "paged">>) => void }) => {
    const [__] = useTranslator();

    const options = [
        {
            id: "mathjax",
            name: "mathjax",
            label: "MathJax",
            description:  "MathJax",
            checked: enableMathJax,
            onChange: () => {
                if (enableMathJax === false) {
                    set({ paged: false, enableMathJax: true });
                }
                set({ enableMathJax: false });
            },
        },
        {
            id: "reduceMotionCheckBox",
            name: "reduceMotionCheckBox",
            label: __("reader.settings.reduceMotion"),
            checked: reduceMotion,
            onChange: () => {
                set({ reduceMotion: !reduceMotion });
            },
        },
        {
            id: "noFootnotesCheckBox",
            name: "noFootnotesCheckBox",
            label: __("reader.settings.noFootnotes"),
            checked: noFootnotes,
            onChange: () => {
                set({ noFootnotes: !noFootnotes });
            },
        },
    ];

    return (
        <div>
            {options.map((option) => (
                <section className={stylesSettings.section} key={option.id}>
                    <div>
                        <input
                            id={option.id}
                            type="checkbox"
                            name={option.name}
                            onChange={option.onChange}
                            defaultChecked={option.checked}
                        />
                        <label htmlFor={option.id}>{option.label}</label>
                    </div>
                </section>

            ))}
        </div>
    );
};

const DivinaSetReadingMode = ({ handleDivinaReadingMode, divinaReadingMode, divinaReadingModeSupported}: Partial<IBaseProps>) => {
    const [__] = useTranslator();

    return (
        <div id={stylesReader.themes_list} aria-label={__("reader.settings.disposition.title")} role="radiogroup">
            <div>
                <input
                    disabled={!divinaReadingModeSupported.includes("double")}
                    id={"radio-" + "double"}
                    type="radio"
                    name="divinaReadingMode"
                    onChange={() => {
                        handleDivinaReadingMode("double");
                    }}
                    checked={divinaReadingMode === "double"}
                />
                <label
                    aria-disabled={!divinaReadingModeSupported.includes("double")}
                    htmlFor={"radio-" + "double"}
                >
                    {divinaReadingMode === "double" && <SVG svg={DoneIcon} ariaHidden />}
                    {"double"}
                </label>
            </div>
            <div>
                <input
                    disabled={!divinaReadingModeSupported.includes("guided")}
                    id={"radio-" + "guided"}
                    type="radio"
                    name="divinaReadingMode"
                    onChange={() => {
                        handleDivinaReadingMode("guided");
                    }}
                    checked={divinaReadingMode === "guided"}
                />
                <label
                    aria-disabled={!divinaReadingModeSupported.includes("guided")}
                    htmlFor={"radio-" + "guided"}
                >
                    {divinaReadingMode === "guided" && <SVG svg={DoneIcon} ariaHidden />}
                    {"guided"}
                </label>
            </div>
            <div>
                <input
                    disabled={!divinaReadingModeSupported.includes("scroll")}
                    id={"radio-" + "scroll"}
                    type="radio"
                    name="divinaReadingMode"
                    onChange={() => {
                        handleDivinaReadingMode("scroll");
                    }}
                    checked={divinaReadingMode === "scroll"}
                />
                <label
                    aria-disabled={!divinaReadingModeSupported.includes("scroll")}
                    htmlFor={"radio-" + "scroll"}
                >
                    {divinaReadingMode === "scroll" && <SVG svg={DoneIcon} ariaHidden />}
                    {"scroll"}
                </label>
            </div>
            <div>
                <input
                    disabled={!divinaReadingModeSupported.includes("single")}
                    id={"radio-" + "single"}
                    type="radio"
                    name="divinaReadingMode"
                    onChange={() => {
                        handleDivinaReadingMode("single");
                    }}
                    checked={divinaReadingMode === "single"}
                />
                <label
                    aria-disabled={!divinaReadingModeSupported.includes("single")}
                    htmlFor={"radio-" + "single"}
                >
                    {divinaReadingMode === "single" && <SVG svg={DoneIcon} ariaHidden />}
                    {"single"}
                </label>
            </div>
        </div>
    );
};

const PdfZoom = ({pdfScale, pdfView}: Pick<IState, "pdfScale" | "pdfView">) => {
    const [__] = useTranslator();

    const inputComponent = (scale: IPdfPlayerScale, disabled = false) => {
        return <div>
            <input
                id={"radio-" + `${scale}`}
                type="radio"
                name="pdfZoomRadios"
                onChange={() => createOrGetPdfEventBus().dispatch("scale", scale)}
                checked={pdfScale === scale}
                disabled={disabled}
            />
            <label
                aria-disabled={disabled}
                htmlFor={"radio-" + `${scale}`}
            >
                {pdfScale === scale && <SVG svg={DoneIcon} ariaHidden />}
                {
                    scale === 50 ? __("reader.settings.pdfZoom.name.50pct") :
                        (scale === 100 ? __("reader.settings.pdfZoom.name.100pct") :
                            (scale === 150 ? __("reader.settings.pdfZoom.name.150pct") :
                                (scale === 200 ? __("reader.settings.pdfZoom.name.200pct") :
                                    (scale === 300 ? __("reader.settings.pdfZoom.name.300pct") :
                                        (scale === 500 ? __("reader.settings.pdfZoom.name.500pct") :
                                            (scale === "page-fit" ? __("reader.settings.pdfZoom.name.fit") :
                                                (scale === "page-width" ? __("reader.settings.pdfZoom.name.width") : "Zoom ??!")))))))
                    // --("reader.settings.pdfZoom.name." + scale as any)
                }
            </label>
        </div>;
    };

    return (
        <div id={stylesReader.themes_list} role="radiogroup" aria-label={__("reader.settings.pdfZoom.title")}>
            {inputComponent("page-fit")}
            {inputComponent("page-width", pdfView === "paginated")}
            {inputComponent(50, pdfView === "paginated")}
            {inputComponent(100, pdfView === "paginated")}
            {inputComponent(150, pdfView === "paginated")}
            {inputComponent(200, pdfView === "paginated")}
            {inputComponent(300, pdfView === "paginated")}
            {inputComponent(500, pdfView === "paginated")}
        </div>
    );
};

const AllowCustom = ({ overridePublisherDefault, set }:
    { overridePublisherDefault: boolean,
    set: () => void }) => {
    const [__] = useTranslator();
        return(
            <>
                <input id="allow-custom" type="checkbox" checked={overridePublisherDefault} onChange={() => {set();}
            }/>

                <label htmlFor="allow-custom">{__("reader.settings.customizeReader")}</label>
            </>
        );
};

export const ReaderSettings: React.FC<IBaseProps> = (props) => {
    const { setSettings, readerConfig, open } = props;
    const { setDockingMode, dockedMode, dockingMode } = props;
    const { handleDivinaReadingMode, divinaReadingMode, divinaReadingModeSupported } = props;
    const [__] = useTranslator();

    const [pdfState, setPdfState] = React.useState<IState>({
        pdfScale: undefined,
        pdfCol: undefined,
        pdfView: undefined,
    });

    const setScale = (scale: IPdfPlayerScale) => {

        console.log("scale", scale);

        setPdfState({
            pdfScale: scale,
        });
    };

    const setView = (view: IPdfPlayerView) => {

        console.log("view", view);

        setPdfState({
            pdfView: view,
        });
    };

    const setCol = (col: IPdfPlayerColumn) => {

        console.log("col", col);

        setPdfState({
            pdfCol: col,
        });
    };

    React.useEffect(() => {
        createOrGetPdfEventBus().subscribe("scale", setScale);
        createOrGetPdfEventBus().subscribe("view", setView);
        createOrGetPdfEventBus().subscribe("column", setCol);

        return () => {
            createOrGetPdfEventBus().remove(setScale, "scale");
            createOrGetPdfEventBus().remove(setView, "view");
            createOrGetPdfEventBus().remove(setCol, "column");
        };

    }, []);

    const setPartialSettingsDebounced = React.useMemo(() => {
        const saveConfig = (config: Partial<ReaderConfig>) => {
            setSettings({ ...readerConfig, ...config });
        };
        return debounce(saveConfig, 400);
    }, [readerConfig]);

    React.useEffect(() => {
        setPartialSettingsDebounced.clear();
        return () => setPartialSettingsDebounced.flush();
    }, [setPartialSettingsDebounced]);

    const [overridePublisherDefault, setOverride] = React.useState(false);
    const [tabValue, setTabValue] = React.useState("tab-display");



    React.useEffect(() => {
        let ov = false;
        for (const [key, value] of Object.entries(readerConfigInitialStateDefaultPublisher)) {
            if (readerConfig[key as keyof typeof readerConfigInitialState] === value) continue;
            else {
                ov = true;
                break;
            }
        }
        setOverride(ov);
    }, [readerConfig]);

    const setOverridePublisherDefault = React.useMemo(() => () => {
        if (overridePublisherDefault) {
            setPartialSettingsDebounced(readerConfigInitialStateDefaultPublisher);
            setTabValue("tab-display");
        } else {
            setOverride(true);
            setTabValue("tab-text");
        }
    }, [overridePublisherDefault]);

    const dockedModeRef = React.useRef<HTMLButtonElement>();
    const tabModeRef = React.useRef<HTMLDivElement>();
    React.useEffect(() => {
        console.log("ReaderSettings UPDATED");

        setTimeout(() => {
            console.log("readerSettings FOCUS");

            if (dockedMode) {
                if (dockedModeRef) {
                    dockedModeRef.current?.focus();
                } else {
                    console.error("!no dockedModeRef on combobox");
                }
            } else {
                if (tabModeRef) {
                    tabModeRef.current?.focus();
                } else {
                    console.error("!no tabModeRef on tabList");
                }
            }
        }, 1);

        const itv = setTimeout(() => {
            console.log("readerSettings FOCUS");

            if (dockedMode) {
                if (dockedModeRef) {
                    dockedModeRef.current?.focus();
                } else {
                    console.error("!no dockedModeRef on combobox");
                }
            } else {
                if (tabModeRef) {
                    tabModeRef.current?.focus();
                } else {
                    console.error("!no tabModeRef on tabList");
                }
            }
        }, 1000); // force focus on tabList instead of webview

        return () => clearInterval(itv);
    }, [dockingMode]);

    if (!readerConfig) {
        return <></>;
    }

    if (!open) {
        return <></>;
    }

    const { isDivina, isPdf } = props;
    const isEpub = !isDivina && !isPdf;

    const sections: Array<React.JSX.Element> = [];
    const options: Array<{ id: number, value: string, name: string, disabled: boolean, svg: {} }> = [];

    const TextTrigger =
        <Tabs.Trigger value="tab-text" disabled={overridePublisherDefault ? false : true} key={"tab-text"} data-value={"tab-text"}>
            <SVG ariaHidden svg={TextAreaIcon} />
            <h3>{__("reader.settings.text")}</h3>
            {overridePublisherDefault ? <></> : <i>{__("reader.settings.disabled")}</i>}
        </Tabs.Trigger>;
    const optionTextItem = { id: 0, value: "tab-text", name: __("reader.settings.text"), disabled: overridePublisherDefault ? false : true, svg: TextAreaIcon };

    const DivinaTrigger =
        <Tabs.Trigger value="tab-divina" disabled={overridePublisherDefault ? false : true} key={"tab-divina"}>
            <SVG ariaHidden svg={TextAreaIcon} />
            <h3>{__("reader.settings.disposition.title")}</h3>
        </Tabs.Trigger>;
    const optionDivinaItem = { id: 1, value: "tab-divina", name: __("reader.settings.disposition.title"), disabled: overridePublisherDefault ? false : true, svg: TextAreaIcon };

    const SpacingTrigger =
        <Tabs.Trigger value="tab-spacing" disabled={overridePublisherDefault ? false : true} key={"tab-spacing"} data-value={"tab-spacing"}>
            <SVG ariaHidden svg={AlignLeftIcon} />
            <h3>{__("reader.settings.spacing")}</h3>
            {overridePublisherDefault ? <></> : <i>{__("reader.settings.disabled")}</i>}
        </Tabs.Trigger>;
    const optionSpacingItem = { id: 2, value: "tab-spacing", name: __("reader.settings.spacing"), disabled: overridePublisherDefault ? false : true, svg: AlignLeftIcon };

    const DisplayTrigger =
        <Tabs.Trigger value="tab-display" key={"tab-display"}>
            <SVG ariaHidden svg={LayoutIcon} />
            <h3>{__("reader.settings.display")}</h3>
        </Tabs.Trigger>;
    const optionDisplayItem = { id: 3, value: "tab-display", name: __("reader.settings.display"), disabled: false, svg: LayoutIcon };

    const AudioTrigger =
        <Tabs.Trigger value="tab-audio" key={"tab-audio"}>
            <SVG ariaHidden svg={VolumeUpIcon} />
            <h3>{__("reader.media-overlays.title")}</h3>
        </Tabs.Trigger>;
    const optionAudioItem = { id: 4, value: "tab-audio", name: __("reader.media-overlays.title"), disabled: false, svg: VolumeUpIcon };

    const PdfZoomTrigger =
        <Tabs.Trigger value="tab-pdfzoom" key={"tab-pdfzoom"}>
            <SVG ariaHidden svg={VolumeUpIcon} />
            <h3>{__("reader.settings.pdfZoom.title")}</h3>
        </Tabs.Trigger>;
    const optionPdfZoomItem = { id: 5, value: "tab-pdfzoom", name: __("reader.settings.pdfZoom.title"), disabled: false, svg: VolumeUpIcon };

    const AllowCustomContainer =
        <div className={stylesSettings.allowCustom} key={"allowCustom"}>
            <AllowCustom overridePublisherDefault={overridePublisherDefault} set={setOverridePublisherDefault} />
        </div>;


    if (isDivina) {
        sections.push(DivinaTrigger);
        options.push(optionDivinaItem);
        if (tabValue !== "tab-divina") setTabValue("tab-divina");
    }
    if (isPdf) {
        sections.push(PdfZoomTrigger);
        options.push(optionPdfZoomItem);
        if (tabValue !== "tab-pdfzoom") setTabValue("tab-pdfzoom");
    }
    if (isPdf || isEpub) {
        sections.push(DisplayTrigger);
        options.push(optionDisplayItem);
    }
    if (isEpub) {
        sections.push(AudioTrigger);
        options.push(optionAudioItem);
        sections.push(AllowCustomContainer);
        sections.push(TextTrigger);
        options.push(optionTextItem);
        sections.push(SpacingTrigger);
        options.push(optionSpacingItem);
    }


    const setDockingModeFull = () => setDockingMode("full");
    const setDockingModeLeftSide = () => setDockingMode("left");
    const setDockingModeRightSide = () => setDockingMode("right");

    const optionSelected = options.find(({ value }) => value === tabValue)?.id || 0;
    const optionDisabled = options.map(({ id, disabled }) => disabled ? id : "").filter((v) => !!v) as number[];

    // const Close = Popover.Close;

    console.log("RENDER");

    const SelectRef = React.forwardRef<HTMLButtonElement, MySelectProps<{ id: number, value: string, name: string, disabled: boolean, svg: {} }>>((props, forwardedRef) => <Select refButEl={forwardedRef} {...props}></Select>);
    SelectRef.displayName = "ComboBox";
    return (
        <div>
            {
                dockedMode ? <div key="docked-header" className={stylesPopoverDialog.docked_header}>
                    <SelectRef
                        items={options}
                        selectedKey={optionSelected}
                        disabledKeys={optionDisabled}
                        svg={options.find(({ value }) => value === tabValue)?.svg}
                        onSelectionChange={(id) => {
                            console.log("selectionchange: ", id);
                            const value = options.find(({ id: _id }) => _id === id)?.value;
                            if (value) {
                                setTabValue(value);
                                console.log("set Tab Value = ", value);

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
                        ref={dockedModeRef}
                    >
                        {item => <ComboBoxItem>{item.name}</ComboBoxItem>}
                    </SelectRef>

                    <div key="docked-header-btn" className={stylesPopoverDialog.docked_header_controls}>
                        <button className={stylesButtons.button_transparency_icon} disabled={dockingMode === "left" ? true : false} aria-label="left" onClick={setDockingModeLeftSide}>
                            <SVG ariaHidden={true} svg={DockLeftIcon} />
                        </button>
                        <button className={stylesButtons.button_transparency_icon} disabled={dockingMode === "right" ? true : false} aria-label="right" onClick={setDockingModeRightSide}>
                            <SVG ariaHidden={true} svg={DockRightIcon} />
                        </button>
                        <button className={stylesButtons.button_transparency_icon} disabled={dockingMode === "full" ? true : false} aria-label="full" onClick={setDockingModeFull}>
                            <SVG ariaHidden={true} svg={DockModalIcon} />
                        </button>

                        <Dialog.Close asChild>
                            <button className={stylesButtons.button_transparency_icon} aria-label="Close">
                                <SVG ariaHidden={true} svg={QuitIcon} />
                            </button>
                        </Dialog.Close>
                    </div>
                </div> : <></>
            }
            {
                dockedMode ?
                    <div className={stylesSettings.allowCustom} key={"allowCustom"}>
                        <AllowCustom overridePublisherDefault={overridePublisherDefault} set={setOverridePublisherDefault} />
                    </div>
                : <></>
            }
            <Tabs.Root value={tabValue} defaultValue={tabValue} onValueChange={dockedMode ? null : setTabValue} data-orientation="vertical" orientation="vertical" className={stylesSettings.settings_container}>
                {
                    dockedMode ? <></> :
                        <Tabs.List ref={tabModeRef} className={stylesSettings.settings_tabslist} aria-orientation="vertical" data-orientation="vertical">
                            {sections}
                        </Tabs.List>
                }
                <div className={stylesSettings.settings_content}>
                    <Tabs.Content value="tab-divina" tabIndex={-1}>
                        <TabTitle title={__("reader.settings.disposition.title")} />
                        <div className={stylesSettings.settings_tab}>
                            <DivinaSetReadingMode handleDivinaReadingMode={handleDivinaReadingMode} divinaReadingMode={divinaReadingMode} divinaReadingModeSupported={divinaReadingModeSupported} />
                        </div>
                    </Tabs.Content>
                    <Tabs.Content value="tab-pdfzoom" tabIndex={-1}>
                        <TabTitle title={__("reader.settings.disposition.title")} />
                        <div className={stylesSettings.settings_tab}>
                            <PdfZoom pdfScale={pdfState.pdfScale} pdfView={pdfState.pdfView} />
                        </div>
                    </Tabs.Content>
                    <Tabs.Content value="tab-text" tabIndex={-1}>
                        <TabTitle title={__("reader.settings.text")} />
                        <div className={classNames(stylesSettings.settings_tab, stylesSettings.settings_reading_text, stylesSettings.section)}>
                            <FontSize config={readerConfig} set={setPartialSettingsDebounced} />
                            <FontFamily config={readerConfig} set={setPartialSettingsDebounced} />
                        </div>
                    </Tabs.Content>
                    <Tabs.Content value="tab-spacing" tabIndex={-1}>
                        <TabTitle title={__("reader.settings.spacing")} />
                        <div className={stylesSettings.settings_tab}>
                            <ReadingSpacing config={readerConfig} set={setPartialSettingsDebounced} />
                        </div>
                    </Tabs.Content>
                    <Tabs.Content value="tab-display" tabIndex={-1}>
                        <TabTitle title={__("reader.settings.display")} />
                        <section className={stylesSettings.settings_tab}>
                            {isPdf ? <></> : <Theme theme={readerConfig} set={setPartialSettingsDebounced} />}
                            {isPdf ? <></> : <ReadingDisplayLayout config={readerConfig} set={setPartialSettingsDebounced} />}
                            {isPdf ? <></> : <ReadingDisplayAlign config={readerConfig} set={setPartialSettingsDebounced} />}
                            <ReadingDisplayCol config={readerConfig} set={setPartialSettingsDebounced} isPdf={props.isPdf} pdfCol={pdfState.pdfCol} />
                            {isPdf ? <></> : <ReadingDisplayMathJax config={readerConfig} set={setPartialSettingsDebounced} />}
                        </section>
                    </Tabs.Content>
                    <Tabs.Content value="tab-audio" tabIndex={-1}>
                        <TabTitle title={__("reader.media-overlays.title")} />
                        <section className={stylesSettings.settings_tab}>
                            <ReadingAudio config={readerConfig} set={setPartialSettingsDebounced} />
                        </section>
                    </Tabs.Content>
                </div>
            </Tabs.Root>
            {
                dockedMode ? <></> :
                    <div key="modal-header" className={stylesSettings.close_button_div}>
                        <button className={stylesButtons.button_transparency_icon} aria-label="left" onClick={setDockingModeLeftSide}>
                            <SVG ariaHidden={true} svg={DockLeftIcon} />
                        </button>
                        <button className={stylesButtons.button_transparency_icon} aria-label="right" onClick={setDockingModeRightSide}>
                            <SVG ariaHidden={true} svg={DockRightIcon} />
                        </button>
                        <button className={stylesButtons.button_transparency_icon} disabled aria-label="full" onClick={setDockingModeFull}>
                            <SVG ariaHidden={true} svg={DockModalIcon} />
                        </button>
                        <Dialog.Close asChild>
                            <button className={stylesButtons.button_transparency_icon} aria-label="Close">
                                <SVG ariaHidden={true} svg={QuitIcon} />
                            </button>
                        </Dialog.Close>
                    </div>
            }
        </div>
    );
};
