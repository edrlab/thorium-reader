// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.scss";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as stylesReader from "readium-desktop/renderer/assets/styles/reader-app.scss";
import * as stylesPopoverDialog from "readium-desktop/renderer/assets/styles/components/popoverDialog.scss";
import * as stylesAnnotations from "readium-desktop/renderer/assets/styles/components/annotations.scss";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Tabs from "@radix-ui/react-tabs";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { ComboBox, ComboBoxItem } from "readium-desktop/renderer/common/components/ComboBox";
import { MySelectProps, Select } from "readium-desktop/renderer/common/components/Select";

import SVG, { ISVGProps } from "readium-desktop/renderer/common/components/SVG";
import * as GuearIcon from "readium-desktop/renderer/assets/icons/gear-icon.svg";
import * as QuitIcon from "readium-desktop/renderer/assets/icons/close-icon.svg";
import * as TextAreaIcon from "readium-desktop/renderer/assets/icons/textarea-icon.svg";
import * as LayoutIcon from "readium-desktop/renderer/assets/icons/layout-icon.svg";
import * as AlignLeftIcon from "readium-desktop/renderer/assets/icons/alignleft-icon.svg";
import * as VolumeUpIcon from "readium-desktop/renderer/assets/icons/volume-icon.svg";
import * as ScrollableIcon from "readium-desktop/renderer/assets/icons/scroll-icon.svg";
import * as PaginatedIcon from "readium-desktop/renderer/assets/icons/page-icon.svg";
import * as TwoColsIcon from "readium-desktop/renderer/assets/icons/2cols-icon.svg";
import * as AlignJustifyIcon from "readium-desktop/renderer/assets/icons/align-justify-icon.svg";
import * as DockLeftIcon from "readium-desktop/renderer/assets/icons/dockleft-icon.svg";
import * as DockRightIcon from "readium-desktop/renderer/assets/icons/dockright-icon.svg";
import * as DockModalIcon from "readium-desktop/renderer/assets/icons/dockmodal-icon.svg";
import * as DoneIcon from "readium-desktop/renderer/assets/icons/done.svg";
import * as SaveIcon from "readium-desktop/renderer/assets/icons/floppydisk-icon.svg";
import * as DoubleCheckIcon from "readium-desktop/renderer/assets/icons/doubleCheck-icon.svg";
import * as CheckIcon from "readium-desktop/renderer/assets/icons/singlecheck-icon.svg";
import * as ResetIcon from "readium-desktop/renderer/assets/icons/clock-reverse-icon.svg";
import * as MinusIcon from "readium-desktop/renderer/assets/icons/Minus-Bold.svg";
import * as PlusIcon from "readium-desktop/renderer/assets/icons/Plus-bold.svg";
import * as InfoIcon from "readium-desktop/renderer/assets/icons/info-icon.svg";
import * as DefaultPageIcon from "readium-desktop/renderer/assets/icons/defaultPage-icon.svg";

import classNames from "classnames";
import { IPdfPlayerColumn, IPdfPlayerScale, IPdfPlayerView } from "../pdf/common/pdfReader.type";
import optionsValues, { AdjustableSettingsStrings, IReaderSettingsProps } from "./options-values";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { ReaderConfig, TTheme } from "readium-desktop/common/models/reader";
import { FONT_LIST, FONT_LIST_WITH_JA } from "readium-desktop/utils/fontList";
import { createOrGetPdfEventBus } from "../pdf/driver";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import { readerLocalActionReader } from "../redux/actions";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { readerConfigInitialState } from "readium-desktop/common/redux/states/reader";
import { useDiffBoolBetweenReaderConfigAndDefaultConfig, usePublisherReaderConfig, useReaderConfig, useReaderConfigAll, useSavePublisherReaderConfig, useSavePublisherReaderConfigDebounced, useSaveReaderConfig, useSaveReaderConfigDebounced } from "readium-desktop/renderer/common/hooks/useReaderConfig";
import { readerActions } from "readium-desktop/common/redux/actions";
import { comparePublisherReaderConfig } from "../../../common/publisherConfig";
import debounce from "debounce";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";
import { HighlightDrawTypeBackground, HighlightDrawTypeUnderline, HighlightDrawTypeOutline, HighlightDrawTypeOpacityMask, HighlightDrawTypeOpacityMaskRuler } from "@r2-navigator-js/electron/common/highlight";
import { TTSStateEnum } from "@r2-navigator-js/electron/renderer/readaloud";
import { hexToRgb, rgbToHex } from "readium-desktop/common/rgb";
import { TTranslatorKeyParameter } from "readium-desktop/typings/en.translation-keys";
import { noteColorCodeToColorTranslatorKeySet } from "readium-desktop/common/redux/states/renderer/note";
import { trimNormaliseWhitespaceAndCollapse } from "readium-desktop/common/string";

const noteColorCodeToColorTranslatorKeySet_ = {
    [rgbToHex(readerConfigInitialState.ttsHighlightColor)]: "Dark Yellow" as TTranslatorKeyParameter,
    [rgbToHex(readerConfigInitialState.ttsHighlightColor_WORD)]: "Dark Orange" as TTranslatorKeyParameter,
    ...noteColorCodeToColorTranslatorKeySet,
};

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends IReaderSettingsProps {
    // handleSettingsClick: (open: boolean) => void;

    // tabValue: string;
    // setTabValue: (value: string) => void;
}

interface IState {
    pdfScale?: IPdfPlayerScale | undefined;
    pdfView?: IPdfPlayerView | undefined;
    pdfCol?: IPdfPlayerColumn | undefined;
    spreadModeEven?: boolean | undefined;
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

const Theme = ({ dockedMode }: { dockedMode: boolean }) => {
    const [__] = useTranslator();
    const theme = useReaderConfig("theme");
    const set = useSaveReaderConfigDebounced();

    const [themeOptions] = React.useState(() => [
        {
            id: 1,
            name: `${__("reader.settings.theme.name.Neutral")}`,
            value: "neutral",
            style: { backgroundColor: "#fefefe", color: "black" },
        },
        {
            id: 2,
            name: `${__("reader.settings.theme.name.Sepia")}`,
            value: "sepia",
            style: { backgroundColor: "#faf4e8", color: "black" },
        },
        {
            id: 3,
            name: `${__("reader.settings.theme.name.Night")}`,
            value: "night",
            style: { backgroundColor: "#121212", color: "#fff" },
        },
        {
            id: 4,
            name: `${__("reader.settings.theme.name.Paper")}`,
            value: "paper",
            style: { backgroundColor: "#E9DDC8", color: "#000000" },
        },
        {
            id: 5,
            name: `${__("reader.settings.theme.name.Contrast1")}`,
            value: "contrast1",
            style: { backgroundColor: "#000000", color: "#fff" },
        },
        {
            id: 6,
            name: `${__("reader.settings.theme.name.Contrast2")}`,
            value: "contrast2",
            style: { backgroundColor: "#000000", color: "#FFFF00" },
        },
        {
            id: 7,
            name: `${__("reader.settings.theme.name.Contrast3")}`,
            value: "contrast3",
            style: { backgroundColor: "#181842", color: "#FFFF" },
        },
        {
            id: 8,
            name: `${__("reader.settings.theme.name.Contrast4")}`,
            value: "contrast4",
            style: { backgroundColor: "#C5E7CD", color: "#000000" },
        },
    ]);


    const defaultKey =
        theme === "neutral" ? 1
            : theme === "night" ? 3
                : theme === "sepia" ? 2
                    : theme === "contrast1" ? 5
                        : theme === "paper" ? 4
                            : theme === "contrast2" ? 6
                                : theme === "contrast3" ? 7
                                    : theme === "contrast4" ? 8
                                        : 1;

    return (
        <section className={stylesSettings.section}>
            <h4>{__("reader.settings.theme.title")}</h4>
            <RadioGroup.Root orientation="horizontal" style={{ display: "flex", gap: dockedMode ? "10px" : "20px", marginTop: "5px", flexWrap: "wrap" }}
                value={themeOptions.find((theme) => theme.id === defaultKey).value}
                onValueChange={(option) => set({ theme: option as TTheme })}
            >
                {themeOptions.map((theme) =>
                    <RadioGroupItem
                        key={theme.value}
                        value={theme.value}
                        description={theme.name}
                        className={stylesSettings.settings_theme_container}
                        style={theme.style}
                        svg={defaultKey === theme.id ? DoubleCheckIcon : null}
                    />,
                )}
                {/* <RadioGroupItem
                value="neutral"
                description={`${__("reader.settings.theme.name.Neutral")}`}
                className={stylesSettings.settings_theme_container}
                style={{backgroundColor: "#fff", color: "black"}}
                svg={defaultKey === 1 ? CheckIcon : null}
                />
                <RadioGroupItem
                value="sepia"
                description={`${__("reader.settings.theme.name.Sepia")}`}
                className={stylesSettings.settings_theme_container}
                style={{backgroundColor: "#faf4e8", color: "black"}}
                svg={defaultKey === 2 ? CheckIcon : null}
                />
                <RadioGroupItem
                value="night"
                description={`${__("reader.settings.theme.name.Night")}`}
                className={stylesSettings.settings_theme_container}
                style={{backgroundColor: "#2D2D2D", color: "#fff" }}
                svg={defaultKey === 3 ? CheckIcon : null}
                /> */}
            </RadioGroup.Root>
        </section>
    );
};

export const FontSize = () => {
    const [__] = useTranslator();

    const fontSize = usePublisherReaderConfig("fontSize");
    const set = useSavePublisherReaderConfigDebounced();

    const [currentSliderValue, setCurrentSliderValue] = React.useState(fontSize.replace(/%/g, ""));

    React.useEffect(() => {
        setCurrentSliderValue(fontSize.replace(/%/g, ""));
    }, [fontSize]);

    const click = (direction: string) => {
        const step = 12.5;
        let newStepValue: number;

        if (direction === "out") {
            newStepValue = Number(currentSliderValue.replace(/%/g, "")) - step;
        } else {
            newStepValue = Number(currentSliderValue.replace(/%/g, "")) + step;
        }
        const clampedValue = Math.min(Math.max(newStepValue, 75), 400);
        const valueToString = clampedValue.toFixed(1);
        setCurrentSliderValue(valueToString);
        set({ fontSize: valueToString + "%" });
    };

    return (
        <section>
            <h4>{__("reader.settings.fontSize")} ({fontSize})</h4>
            <div className={stylesSettings.size_range}>
                <button onClick={() => {
                    const newValue = "100%";
                    setCurrentSliderValue(newValue.replace(/%/g, ""));
                    set({ fontSize: newValue });
                }
                } className={stylesSettings.reset_button} title="default value">
                    <SVG ariaHidden svg={ResetIcon} />
                </button>
                <button onClick={() => click("out")} className={stylesSettings.scale_button}><SVG ariaHidden svg={MinusIcon} /></button>
                <input
                    type="range"
                    aria-labelledby="label_fontSize"
                    min={75}
                    max={400}
                    step={12.5}
                    aria-valuemin={0}
                    value={currentSliderValue}
                    onChange={(e) => {
                        const newValue = e.target?.value || "100";
                        setCurrentSliderValue(newValue);
                        set({ fontSize: newValue + "%" });
                    }
                    }
                    className={currentSliderValue === "100" ? stylesSettings.range_inactive : ""}
                />
                <button onClick={() => click("in")} className={stylesSettings.scale_button}><SVG ariaHidden svg={PlusIcon} /></button>
            </div>
        </section>
    );
};

export const FontFamily = () => {
    const [__] = useTranslator();

    const font = usePublisherReaderConfig("font");
    const set = useSavePublisherReaderConfig();

    const locale = useSelector((state: ICommonRootState) => state.i18n.locale);
    const fontList = locale === "ja" ? FONT_LIST_WITH_JA : FONT_LIST;
    const options = fontList.map((fontItem, id) => ({ id, value: fontItem.id, name: fontItem.label, fontFamily: fontItem.fontFamily }));
    // if (fontList.findIndex((v) => v.id === font) < 0) {
    //     options.push({
    //         id: fontList.length,
    //         value: font,
    //         name: font,
    //         fontFamily: `${font}, Consolas, monospace`,
    //     });
    // }

    const selected = options.find((v) => v.value === font) || {
        id: fontList.length,
        value: font,
        name: font,
        fontFamily: `${font}, Consolas, monospace`,
    };

    const defaultkey = selected.id;
    const fontFamily = selected.fontFamily;
    const fontName = selected.name;

    const [inputval, setInputval] = React.useState(fontName);

    React.useEffect(() => {
        setInputval(fontName);
    }, [fontName]);

    const saveFont = (value: string) => {
        let val = value.trim();
        // a"b:c    ;d;<e>f'g&h
        val = trimNormaliseWhitespaceAndCollapse(
            val.
            replace(/"/g, "").
            replace(/:/g, "").
            replace(/'/g, "").
            replace(/;/g, "").
            replace(/</g, "").
            replace(/>/g, "").
            replace(/\\/g, "").
            replace(/\//g, "").
            replace(/&/g, ""),
        );
        if (!val) { // includes empty string (falsy)
            val = undefined;
        }
        if (val) {
            set({ font: val });
        }
    };


    return (
        <div>
            <ComboBox label={__("reader.settings.font")} defaultItems={options} selectedKey={defaultkey} placeholder={inputval}
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
            <div className={stylesSettings.session_text} style={{ marginTop: "0", marginRight: "20px" }}>
                <SVG ariaHidden svg={InfoIcon} />
                {
                    options.find((v) => v.name === inputval) ?
                    <p>{__("reader.settings.infoCustomFont")}</p>
                    :
                    <p>{__("reader.settings.customFontSelected")}</p>
                }
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h4>{__("reader.settings.preview")}:</h4>
                <span
                    aria-hidden
                    style={{
                        fontSize: "1.4em",
                        lineHeight: "1.2em",
                        display: "block",
                        fontFamily,
                    }}>{fontName}
                </span>
            </div>
        </div>
    );
};

interface ITable {
    title: string,
    ariaLabel: string,
    ariaValuemin: number,
    defaultValue: string,
    parameter: keyof AdjustableSettingsStrings;
    altParameter: string,
    rem: boolean,
}

const Slider = ({ value, option, set }: { value: string, option: ITable, set: (a: Pick<ReaderConfig, "pageMargins" | "wordSpacing" | "letterSpacing" | "paraSpacing" | "lineHeight">) => void }) => {
    const [currentSliderValue, setCurrentSliderValue] = React.useState(option.defaultValue);
    const [currentIndex, setCurrentIndex] = React.useState(() => (optionsValues[option.parameter] ||  [] ).findIndex((el) => el === option.defaultValue) || 0);

    React.useEffect(() => {
        setCurrentSliderValue(value);
        const newIndex = (optionsValues[option.parameter] || [] ).findIndex((el) => el === value) || 0;
        setCurrentIndex(newIndex);
    }, [value, option.parameter]);

    const updateValue = (index: number) => {
        const newValue = (optionsValues[option.parameter] || [])[index] || "0";
        setCurrentSliderValue(newValue);
        setCurrentIndex(index);
        set({ [option.parameter]: newValue } as Pick<ReaderConfig, "pageMargins" | "wordSpacing" | "letterSpacing" | "paraSpacing" | "lineHeight">);
    };

    const click = (direction: string) => {
        setCurrentIndex((prevIndex) => {
            const newIndex = direction === "out" ? prevIndex - 1 : prevIndex + 1;
            if (newIndex >= 0 && newIndex < optionsValues[option.parameter].length) {
                updateValue(newIndex);
            }
            return prevIndex;
        });
    };

    return (
        <section className={stylesSettings.section} key={option.title}>
            <div className={stylesSettings.spacing_heading}>
                <h4>{option.title}</h4>
                <p>
                    {currentSliderValue === "0" ? "auto" : currentSliderValue}
                </p>
            </div>
            <div className={stylesSettings.size_range}>
                <button
                    onClick={() => updateValue(0)}
                    className={stylesSettings.reset_button}
                    title="default value"
                >
                    <SVG ariaHidden svg={ResetIcon} />
                </button>
                <button onClick={() => click("out")} className={stylesSettings.scale_button}>
                    <SVG ariaHidden svg={MinusIcon} />
                </button>
                <input
                    id={option.title}
                    type="range"
                    aria-labelledby={option.ariaLabel}
                    min="0"
                    max={optionsValues[option.parameter].length - 1}
                    value={currentIndex}
                    aria-valuemin={option.ariaValuemin}
                    onChange={(e) => updateValue(parseInt(e.target.value, 10))}
                    className={currentSliderValue === "0" ? stylesSettings.range_inactive : ""}
                />
                <button onClick={() => click("in")} className={stylesSettings.scale_button}>
                    <SVG ariaHidden svg={PlusIcon} />
                </button>
            </div>
        </section>
    );
};


const ReadingSpacing = () => {

    const [__] = useTranslator();

    const set = useSavePublisherReaderConfigDebounced();
    const config = useSelector((state: IReaderRootState) => state.reader.config);
    const { pageMargins, wordSpacing, letterSpacing, paraSpacing, lineHeight } = config;
    const spacingOptions: ITable[] = [
        {
            title: `${__("reader.settings.margin")}`,
            ariaLabel: "label_pageMargins",
            ariaValuemin: 0,
            defaultValue: pageMargins,
            parameter: "pageMargins",
            altParameter: `${readerConfigInitialState.pageMargins}`,
            rem: false,
        },
        {
            title: `${__("reader.settings.wordSpacing")}`,
            ariaLabel: "label_wordSpacing",
            ariaValuemin: 0,
            defaultValue: wordSpacing,
            parameter: "wordSpacing",
            altParameter: `${readerConfigInitialState.wordSpacing}`,
            rem: true,
        },
        {
            title: `${__("reader.settings.letterSpacing")}`,
            ariaLabel: "label_letterSpacing",
            ariaValuemin: 0,
            defaultValue: letterSpacing,
            parameter: "letterSpacing",
            altParameter: `${readerConfigInitialState.letterSpacing}`,
            rem: true,
        },
        {
            title: `${__("reader.settings.paraSpacing")}`,
            ariaLabel: "label_paraSpacing",
            ariaValuemin: 0,
            defaultValue: paraSpacing,
            parameter: "paraSpacing",
            altParameter: `${readerConfigInitialState.paraSpacing}`,
            rem: true,
        },
        {
            title: `${__("reader.settings.lineSpacing")}`,
            ariaLabel: "label_lineHeight",
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
                <Slider value={config[option.parameter]} option={option} key={option.title} set={set} />
            ))}
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

const RadioGroupItem = (props: IRadioGroupItemProps) => {
    return (
        <RadioGroup.Item
            data-input-type="radio"
            value={props.value} id={props.value} className={classNames(stylesSettings.display_options_item, props.className)} disabled={props.disabled} style={props.style}>
            {props.svg ? <SVG ariaHidden svg={props.svg} /> : <></>}
            {props.description}
        </RadioGroup.Item>
    );
};

const ReadingDisplayLayout = ({ isFXL }: { isFXL: boolean }) => {
    const [__] = useTranslator();
    const layout = useReaderConfig("paged");
    const set = useSaveReaderConfigDebounced();
    return (
        <div className={stylesSettings.section}>
            <h4>{__("reader.settings.disposition.title")}</h4>
            <div className={stylesSettings.display_options}>
                <RadioGroup.Root orientation="horizontal" style={{ display: "flex", gap: "10px" }} value={(layout || isFXL) ? "page_option" : "scroll_option"}
                    onValueChange={(v) => set({ paged: v === "page_option" })}
                >
                    <RadioGroupItem value="scroll_option" description={`${__("reader.settings.scrolled")}`} svg={ScrollableIcon} disabled={isFXL} />
                    <RadioGroupItem value="page_option" description={`${__("reader.settings.paginated")}`} svg={PaginatedIcon} disabled={false} />
                </RadioGroup.Root>
            </div>
        </div>
    );
};

const ReadingDisplayCol = ({ isPdf, spreadModeEven, pdfCol }: Pick<IBaseProps, "isPdf"> & Pick<IState, "spreadModeEven"> & Pick<IState, "pdfCol">) => {
    const [__] = useTranslator();

    const paged = useReaderConfig("paged");
    const colCount = useReaderConfig("colCount");
    const set = useSaveReaderConfigDebounced();
    const scrollable = !paged;

    const [state, setState] = React.useState(scrollable ? "auto" : colCount);
    React.useEffect(() => {
        if (scrollable) {
            setState("auto");
        } else {
            setState(colCount);
        }
    }, [scrollable, colCount]);

    // console.log("ReadingDisplayCol spreadModeEven", spreadModeEven);
    // console.log("ReadingDisplayCol pdfCol", pdfCol);
    return (
        <section className={stylesSettings.section}>
            <div>
                <h4>{__("reader.settings.column.title")}</h4>
            </div>
            <div className={stylesSettings.display_options}>
                <RadioGroup.Root orientation="horizontal" style={{ display: "flex", gap: "10px" }} value={isPdf ? (pdfCol ? pdfCol : "1") : state}
                    onValueChange={(v) => {
                        if (isPdf) {
                            createOrGetPdfEventBus().dispatch("column", v === "auto" ? "1" : v === "1" ? "1" : "2");
                        } else {
                            set({ colCount: v });
                        }
                    }}
                >
                    {isPdf ? <></> : <RadioGroupItem value="auto" description={`${__("reader.settings.column.auto")}`} svg={DefaultPageIcon} disabled={false} />}
                    <RadioGroupItem value="1" description={`${__("reader.settings.column.one")}`} svg={AlignJustifyIcon} disabled={isPdf ? false : scrollable} />
                    <RadioGroupItem value="2" description={`${__("reader.settings.column.two")}`} svg={TwoColsIcon} disabled={isPdf ? false : scrollable} />
                </RadioGroup.Root>
            </div>
            {!isPdf || pdfCol === "auto" || pdfCol === "1" /* disabled={pdfCol === "auto" || pdfCol === "1"} */
                ? <></> :
                <div className={stylesSettings.display_options}>
                    <input type="checkbox"
                        checked={!!spreadModeEven}
                        onChange={() => { createOrGetPdfEventBus().dispatch("spreadModeEven", !(!!spreadModeEven)); }}
                        id="spreadModeEvenCheckbox" name="spreadModeEvenCheckbox" className={stylesGlobal.checkbox_custom_input} />
                    {/* label htmlFor clicked with mouse cursor causes onChange() of input (which is display:none), but keyboard interaction (tab stop and space bar toggle) occurs with the div role="checkbox" below! (onChange is not called, only onKeyUp) */}
                    <label htmlFor="spreadModeEvenCheckbox" className={stylesGlobal.checkbox_custom_label}>
                        <div
                            tabIndex={0}
                            role="checkbox"
                            aria-checked={!!spreadModeEven}
                            aria-label={__("reader.settings.spreadModeEven")}
                            onKeyDown={(e) => {
                                // if (e.code === "Space") {
                                if (e.key === " ") {
                                    e.preventDefault(); // prevent scroll
                                }
                            }}
                            onKeyUp={(e) => {
                                // Includes screen reader tests:
                                // if (e.code === "Space") { WORKS
                                // if (e.key === "Space") { DOES NOT WORK
                                // if (e.key === "Enter") { WORKS
                                if (e.key === " ") { // WORKS
                                    e.preventDefault();
                                    createOrGetPdfEventBus().dispatch("spreadModeEven", !(!!spreadModeEven));
                                }
                            }}
                            className={stylesGlobal.checkbox_custom}
                            style={{ border: !!spreadModeEven ? "2px solid transparent" : "2px solid var(--color-primary)", backgroundColor: !!spreadModeEven ? "var(--color-blue)" : "transparent" }}>
                            {!!spreadModeEven ?
                                <SVG ariaHidden svg={CheckIcon} className={stylesGlobal.checkbox_customsvg} />
                                :
                                <></>
                            }
                        </div>
                        <span aria-hidden>
                            {__("reader.settings.spreadModeEven")}
                        </span>
                    </label>
                </div>
            }
        </section>
    );
};

const ReadingDisplayAlign = () => {
    const [__] = useTranslator();

    const align = useReaderConfig("align");
    const set = useSaveReaderConfigDebounced();

    return (
        <section className={stylesSettings.section}>
            <div>
                <h4>{__("reader.settings.justification")}</h4>
            </div>
            <div className={stylesSettings.display_options}>
                <RadioGroup.Root orientation="horizontal" style={{ display: "flex", gap: "10px" }} value={align}
                    onValueChange={(v) => set({ align: v })}
                >
                    <RadioGroupItem value="auto" description={`${__("reader.settings.column.auto")}`} svg={DefaultPageIcon} disabled={false} />
                    <RadioGroupItem value="justify" description={`${__("reader.settings.justify")}`} svg={AlignJustifyIcon} disabled={false} />
                    <RadioGroupItem value="start" description={`${__("reader.svg.left")}`} svg={AlignLeftIcon} disabled={false} />
                </RadioGroup.Root>
            </div>
        </section>
    );
};

export const ReadingAudio = ({ useMO, ttsState, ttsPause, ttsResume }: { useMO: boolean, ttsState: TTSStateEnum, ttsPause: () => void, ttsResume: () => void }) => {
    const [__] = useTranslator();

    // : Pick<ReaderConfig, "ttsEnableOverlayMode" | "mediaOverlaysEnableCaptionsMode" | "ttsAndMediaOverlaysDisableContinuousPlay" | "mediaOverlaysEnableSkippability" | "ttsEnableSentenceDetection">
    const config = useReaderConfigAll();
    const { ttsHighlightStyle, ttsHighlightStyle_WORD, ttsHighlightColor, ttsHighlightColor_WORD, mediaOverlaysEnableCaptionsMode: moCaptions, ttsEnableOverlayMode: ttsCaptions, ttsAndMediaOverlaysDisableContinuousPlay: disableContinuousPlay, mediaOverlaysEnableSkippability: skippability, mediaOverlaysIgnoreAndUseTTS, ttsEnableSentenceDetection: splitTTStext } = config;
    const set = useSaveReaderConfigDebounced();

    const ttsTogglePlayResume = (func: () => void) => {
        const wasPlaying = ttsState === TTSStateEnum.PLAYING;
        if (wasPlaying) {
            ttsPause();
        }
        setTimeout(() => {
            func();
            if (wasPlaying) {
                setTimeout(() => {
                    ttsResume();
                }, 200);
            }
        }, wasPlaying ? 200 : 0);
    };

    const options: ({
        id: string,
        name: string,
        label: string,
        description: string,
        checked: boolean | null,
        value?: string,
        onChange: React.ChangeEventHandler<HTMLInputElement>,
    })[] = [
        {
            id: "captions",
            name: "Captions",
            label: `${__("reader.media-overlays.captions")}`,
            description: `${__("reader.media-overlays.captionsDescription")}`,
            checked: useMO ? moCaptions : ttsCaptions,
            onChange: () => {
                if (useMO) {
                    set({ mediaOverlaysEnableCaptionsMode: !moCaptions });
                } else {
                    // see readerConfig.ts Redux Saga readerConfigChanged (TTS STOP)
                    // ttsTogglePlayResume(() => {
                    //     set({ ttsEnableOverlayMode: !ttsCaptions });
                    // });
                    set({ ttsEnableOverlayMode: !ttsCaptions });
                }
            },
        },
        {
            id: "skippability",
            name: "Skippability",
            label: `${__("reader.media-overlays.skip")}`,
            description: `${__("reader.media-overlays.skipDescription")}`,
            checked: skippability,
            onChange: () => {
                // This is shared with TTS
                set({ mediaOverlaysEnableSkippability: !skippability });
            },
        },
        {
            id: "disableContinuousPlay",
            name: "DisableContinuousPlay",
            label: `${__("reader.media-overlays.disableContinuousPlay")}`,
            description: `${__("reader.media-overlays.disableContinuousPlayDescription")}`,
            checked: disableContinuousPlay,
            onChange: () => {
                set({ ttsAndMediaOverlaysDisableContinuousPlay: !disableContinuousPlay });
            },
        },
    ];

    if (!useMO) {
        options.push({
            id: "splitTTStext",
            name: "splitTTStext",
            label: `${__("reader.tts.sentenceDetect")}`,
            description: `${__("reader.tts.sentenceDetectDescription")}`,
            checked: splitTTStext,
            onChange: () => {
                // see readerConfig.ts Redux Saga readerConfigChanged (TTS STOP)
                // ttsTogglePlayResume(() => {
                //     set({ ttsEnableSentenceDetection: !splitTTStext });
                // });
                set({ ttsEnableSentenceDetection: !splitTTStext });
            },
        });
    } else {
        options.push({
            id: "ignoreMO",
            name: "ignoreMO",
            label: `${__("reader.media-overlays.ignoreAndUseTTS")}`,
            description: `${__("reader.media-overlays.ignoreAndUseTTSDescription")}`,
            checked: mediaOverlaysIgnoreAndUseTTS,
            onChange: () => {
                // see readerConfig.ts Redux Saga readerConfigChanged (TTS STOP)
                // ttsTogglePlayResume(() => {
                //     set({ ttsEnableSentenceDetection: !splitTTStext });
                // });
                set({ mediaOverlaysIgnoreAndUseTTS: !mediaOverlaysIgnoreAndUseTTS });
            },
        });
    }

    const ttsHighlightStyles = [{
        description: __("tts.highlight.solidBackgroundWordUnderline"),
        ttsHS: HighlightDrawTypeBackground,
        ttsHSW: HighlightDrawTypeUnderline,
    }, {
        description: __("tts.highlight.solidBackgroundWordOutline"),
        ttsHS: HighlightDrawTypeBackground,
        ttsHSW: HighlightDrawTypeOutline,
    }, {
        description: __("tts.highlight.solidBackgroundWordSolidBackground"),
        ttsHS: HighlightDrawTypeBackground,
        ttsHSW: HighlightDrawTypeBackground,
    }, {
        description: __("tts.highlight.outlineWordUnderline"),
        ttsHS: HighlightDrawTypeOutline,
        ttsHSW: HighlightDrawTypeUnderline,
    }, {
        description: __("tts.highlight.outlineWordOutline"),
        ttsHS: HighlightDrawTypeOutline,
        ttsHSW: HighlightDrawTypeOutline,
    }, {
        description: __("tts.highlight.outlineWordSolidBackground"),
        ttsHS: HighlightDrawTypeOutline,
        ttsHSW: HighlightDrawTypeBackground,
    }, {
       description: __("tts.highlight.underlineWordUnderline"),
       ttsHS: HighlightDrawTypeUnderline,
       ttsHSW: HighlightDrawTypeUnderline,
    }, {
       description: __("tts.highlight.underlineWordOutline"),
       ttsHS: HighlightDrawTypeUnderline,
       ttsHSW: HighlightDrawTypeOutline,
    }, {
       description: __("tts.highlight.underlineWordSolidBackground"),
       ttsHS: HighlightDrawTypeUnderline,
       ttsHSW: HighlightDrawTypeBackground,
    }, {
        description: __("tts.highlight.maskWordUnderline"),
        ttsHS: HighlightDrawTypeOpacityMask,
        ttsHSW: HighlightDrawTypeUnderline,
    }, {
        description: __("tts.highlight.maskWordOutline"),
        ttsHS: HighlightDrawTypeOpacityMask,
        ttsHSW: HighlightDrawTypeOutline,
    }, {
        description: __("tts.highlight.maskWordSolidBackground"),
        ttsHS: HighlightDrawTypeOpacityMask,
        ttsHSW: HighlightDrawTypeBackground,
    }, {
        description: __("tts.highlight.maskBlockWordUnderline"),
        ttsHS: HighlightDrawTypeOpacityMaskRuler,
        ttsHSW: HighlightDrawTypeUnderline,
    }, {
        description: __("tts.highlight.maskBlockWordOutline"),
        ttsHS: HighlightDrawTypeOpacityMaskRuler,
        ttsHSW: HighlightDrawTypeOutline,
    }, {
        description: __("tts.highlight.maskBlockWordSolidBackground"),
        ttsHS: HighlightDrawTypeOpacityMaskRuler,
        ttsHSW: HighlightDrawTypeBackground,
    }].map((obj, index) => {
        return {
            ...obj,
            id: index,
        };
    });
    const ttsHighlightStylesKey = ttsHighlightStyles.findIndex((obj) => ttsHighlightStyle === obj.ttsHS && ttsHighlightStyle_WORD === obj.ttsHSW);

    const ttsHighlightStyle_ = (typeof ttsHighlightStyle !== "undefined" && ttsHighlightStyle !== null) ? ttsHighlightStyle : readerConfigInitialState.ttsHighlightStyle;
    const ttsHighlightColor_ = ttsHighlightColor || readerConfigInitialState.ttsHighlightColor;
    const ttsHighlightStyle_WORD_ = (typeof ttsHighlightStyle_WORD !== "undefined" && ttsHighlightStyle_WORD !== null) ? ttsHighlightStyle_WORD : readerConfigInitialState.ttsHighlightStyle_WORD;
    const ttsHighlightColor_WORD_ = ttsHighlightColor_WORD || readerConfigInitialState.ttsHighlightColor_WORD;

    const styleSentence = {
        background:
            ttsHighlightStyle_ === HighlightDrawTypeBackground ?
            rgbToHex(ttsHighlightColor_) :
            undefined,
        textDecorationLine:
            ttsHighlightStyle_ === HighlightDrawTypeUnderline ?
            "underline" :
            undefined,
        textDecorationColor:
            ttsHighlightStyle_ === HighlightDrawTypeUnderline ?
            rgbToHex(ttsHighlightColor_) :
            undefined,
        textDecorationThickness: "3px",
        outlineWidth: "3px",
        textUnderlineOffset: "3px",
        outlineStyle:
            ttsHighlightStyle_ === HighlightDrawTypeOutline ?
            "solid" :
            undefined,
        outlineOffset:
            ttsHighlightStyle_ === HighlightDrawTypeOutline ?
            "2px" :
            undefined,
        outlineColor:
            ttsHighlightStyle_ === HighlightDrawTypeOutline ?
            rgbToHex(ttsHighlightColor_) :
            undefined,
        color: "black",
    } satisfies React.CSSProperties;
    const styleWord = {
        background:
            ttsHighlightStyle_WORD_ === HighlightDrawTypeBackground ?
            rgbToHex(ttsHighlightColor_WORD_) :
            undefined,
        textDecorationLine:
            ttsHighlightStyle_WORD_ === HighlightDrawTypeUnderline ?
            "underline" :
            undefined,
        textDecorationColor:
            ttsHighlightStyle_WORD_ === HighlightDrawTypeUnderline ?
            rgbToHex(ttsHighlightColor_WORD_) :
            undefined,
        textDecorationThickness: "3px",
        outlineWidth: "3px",
        textUnderlineOffset: "3px",
        outlineStyle:
            ttsHighlightStyle_WORD_ === HighlightDrawTypeOutline ?
            "solid" :
            undefined,
        outlineColor:
            ttsHighlightStyle_WORD_ === HighlightDrawTypeOutline ?
            rgbToHex(ttsHighlightColor_WORD_) :
            undefined,
        color: "black",
    } satisfies React.CSSProperties;

    return (
        <>
        {
            //gridTemplateColumns: "repeat(auto-fill, minmax(300px,1fr)"
        }
        <div style={{ display: "grid", paddingRight: 25 }}>
            {options.map((option) =>
            <div style={{ padding: "10px 0" }} key={option.id}>
                <input
                    id={option.id}
                    type="checkbox"
                    name={option.name}
                    onChange={option.onChange}
                    defaultChecked={option.checked}
                    className={stylesGlobal.checkbox_custom_input}
                />
                <label htmlFor={option.id} className={stylesGlobal.checkbox_custom_label}>
                    <div
                        tabIndex={0}
                        role="checkbox"
                        aria-checked={option.checked}
                        aria-label={option.label}
                        title={option.description}
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
                                // @ts-expect-error unused function argument (boolean toggle from state)
                                option.onChange();
                            }
                        }}
                        className={stylesGlobal.checkbox_custom}
                        style={{ border: option.checked ? "2px solid transparent" : "2px solid var(--color-primary)", backgroundColor: option.checked ? "var(--color-blue)" : "transparent" }}>
                        {option.checked ?
                            <SVG ariaHidden svg={CheckIcon} />
                            :
                            <></>
                        }
                    </div>
                    <span aria-hidden>
                        {option.label}
                    </span>
                </label>
                {/* <p className={stylesSettings.session_text}>{option.description}</p> */}
            </div>)}
        </div>

        {!useMO ?
        (
        <>
        <div style={{ border: "2px dotted var(--color-verylight-grey-alt)", borderRadius: "1em", padding: 6 }}>
        <div className={stylesReader.ttsSelectRate}>
        <ComboBox label={__("tts.highlight.style")}
            defaultItems={ttsHighlightStyles}
            defaultSelectedKey={ ttsHighlightStylesKey === -1 ? 0 : ttsHighlightStylesKey }
            selectedKey={ ttsHighlightStylesKey === -1 ? 0 : ttsHighlightStylesKey }
            onSelectionChange={(key) => {
                if (key == null || key == undefined) return;
                // const obj = ttsHighlightStyles.find((_obj, index) => index === key);
                const obj = ttsHighlightStyles.find((obj) => obj.id === key);
                if (obj)
                ttsTogglePlayResume(() => {
                    set({ ttsHighlightStyle: obj.ttsHS, ttsHighlightStyle_WORD: obj.ttsHSW });
                });
            }}>
            {item => <ComboBoxItem>{item.description}</ComboBoxItem>}
        </ComboBox>
        </div>
        <div role="radiogroup">
        <p style={{marginBottom:4, paddingBottom: 0, fontWeight:"bold", fontSize:"120%"}}>{__("tts.highlight.mainColor")}</p>
            <div style={{width:"fit-content"}} className={stylesAnnotations.colorPicker} role="radiogroup">
            {
            Object.entries(noteColorCodeToColorTranslatorKeySet_).map(([colorHex, translatorKey]) => {
                const ttsHighlightColorHex = rgbToHex(ttsHighlightColor || readerConfigInitialState.ttsHighlightColor);
                return (
                    <div key={`color_${colorHex}_key`}>
                        <input type="radio" id={`ttscolorpick${colorHex}`} name="ttscolorpick" value={colorHex}
                            onChange={() => {
                                ttsTogglePlayResume(() => {
                                    set({ ttsHighlightColor: hexToRgb(colorHex) });
                                });
                            }}
                            checked={ttsHighlightColorHex === colorHex}
                            aria-label={__(translatorKey)}
                        />
                        <label aria-hidden={true} title={__(translatorKey)} htmlFor={`ttscolorpick${colorHex}`}
                            style={{ backgroundColor: colorHex, border: ttsHighlightColorHex === colorHex ? "1px solid var(--color-dark-grey)" : "" }}
                        >
                            {ttsHighlightColorHex === colorHex ? <SVG ariaHidden svg={DoubleCheckIcon} /> : <></>}
                        </label>
                    </div>
                );
            })
            }
            </div>
            <p style={{ marginBottom: 4, paddingBottom: 0, fontWeight: "bold", fontSize: "120%" }}>{__("tts.highlight.wordColor")}</p>
            <div style={{width:"fit-content"}} className={stylesAnnotations.colorPicker} role="radiogroup">
            {
            Object.entries(noteColorCodeToColorTranslatorKeySet_).map(([colorHex, translatorKey]) => {
                const ttsHighlightColor_WORDHex = rgbToHex(ttsHighlightColor_WORD || readerConfigInitialState.ttsHighlightColor_WORD);
                return (
                    <div key={`colorx_${colorHex}_key`}>
                        <input type="radio" id={`ttscolorpickword${colorHex}`} name="ttscolorpickword" value={colorHex}
                            onChange={() => {
                                ttsTogglePlayResume(() => {
                                    set({ ttsHighlightColor_WORD: hexToRgb(colorHex) });
                                });
                            }}
                            checked={ttsHighlightColor_WORDHex === colorHex}
                            aria-label={__(translatorKey)}
                        />
                        <label aria-hidden={true} title={__(translatorKey)} htmlFor={`ttscolorpickword${colorHex}`}
                            style={{ backgroundColor: colorHex, border: ttsHighlightColor_WORDHex === colorHex ? "1px solid var(--color-dark-grey)" : "" }}
                        >
                            {ttsHighlightColor_WORDHex === colorHex ? <SVG ariaHidden svg={DoubleCheckIcon} /> : <></>}
                        </label>
                    </div>
                );
            })
            }
            </div>
        </div>
        </div>
<div style={{flexBasis: "100%", height: 0}}></div>
<details
aria-hidden={true}
open={false}
style={
{
    width: 0,
    flexBasis: "100%",
    marginTop: 10,
    border: "1px solid var(--color-verylight-grey-alt)",
    padding: 6,
}
}>
<summary style={
{
cursor: "pointer",
}
}>{__("tts.highlight.preview")}</summary>
{
ttsHighlightStyle_ === HighlightDrawTypeOpacityMaskRuler
?
(
<div style={
{
background: "white",
color: "black",
fontFamily: "serif",
marginTop: 6,
padding: 6,
paddingLeft: 50,
paddingRight: 50,
lineHeight: "2em",
}
}>
<p style={
{
fontSize: "1.5em",
}}>
<span style={
{
color: "silver",
}
}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas nec purus sodales, rhoncus nisl ac,</span><br/>
<div style={
{
border: "2px solid black",
borderRadius: "8px",
padding: "4px",
}
}><span>fringilla metus.</span> <span style={styleSentence}>Sed eu dignissim dui. <span style={styleWord}>Curabitur</span> venenatis sollicitudin ultrices. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.</span> <span>Aenean laoreet justo vitae</span><br/></div>
<span style={
{
color: "silver",
}
}>mauris fermentum, eget ultrices augue placerat. Proin massa est, gravida feugiat ipsum feugiat, dapibus porttitor felis.</span>
</p>
</div>
)
:
(
<div style={
{
background: "white",
color: "black",
fontFamily: "serif",
marginTop: 6,
padding: 6,
paddingLeft: 50,
paddingRight: 50,
lineHeight: "2em",
}
}>
<p style={
{
fontSize: "1.5em",
}}>
<span style={
{
color:
ttsHighlightStyle_ === HighlightDrawTypeOpacityMask ?
"silver" :
undefined,
}
}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas nec purus sodales, rhoncus nisl ac, fringilla metus.</span> <span style={styleSentence}>Sed eu dignissim dui. <span style={styleWord}>Curabitur</span> venenatis sollicitudin ultrices. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.</span> <span style={
{
color:
ttsHighlightStyle_ === HighlightDrawTypeOpacityMask ?
"silver" :
undefined,
}
}>Aenean laoreet justo vitae mauris fermentum, eget ultrices augue placerat. Proin massa est, gravida feugiat ipsum feugiat, dapibus porttitor felis.</span>
</p>
</div>
)
}
</details>
        </>
        )
        : <></> }
        </>
    );
};

const ReadingDisplayCheckboxSettings = ({
    disableRTLFlip,
    setDisableRTLFlip,
}:
    {
        disableRTLFlip: IReaderSettingsProps["disableRTLFlip"],
        setDisableRTLFlip: IReaderSettingsProps["setDisableRTLFlip"],
    },
) => {
    const [__] = useTranslator();

    const set = useSaveReaderConfigDebounced();
    const { enableMathJax, reduceMotion, noFootnotes, noTemporaryNavTargetOutline, noRuby } = useReaderConfigAll();

    const options = [
        {
            id: "mathjax",
            name: "mathjax",
            label: __("reader.settings.mathjax"),
            description: "MathJax",
            checked: enableMathJax,
            onChange: () => {
                if (enableMathJax === false) {
                    set({ paged: false, enableMathJax: true });
                    return;
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
        {
            id: "noTemporaryNavTargetOutlineCheckBox",
            name: "noTemporaryNavTargetOutlineCheckBox",
            label: __("reader.settings.noTemporaryNavTargetOutline"),
            checked: noTemporaryNavTargetOutline,
            onChange: () => {
                set({ noTemporaryNavTargetOutline: !noTemporaryNavTargetOutline });
            },
        },
        {
            id: "noRubyCheckBox",
            name: "noRubyCheckBox",
            label: __("reader.settings.noRuby"),
            checked: noRuby,
            onChange: () => {
                set({ noRuby: !noRuby });
            },
        },
        {
            id: "noRTLFlipCheckBox",
            name: "noRTLFlipCheckBox",
            label: __("reader.settings.noRTLFlip"),
            checked: disableRTLFlip,
            onChange: () => {
                setDisableRTLFlip(!disableRTLFlip);
            },
        },
    ];

    return (
        <div>
            {options.map((option) => (
                <section key={option.id}>
                    <div className={stylesReader.display_checkbox_section}>
                        <input
                            id={option.id}
                            type="checkbox"
                            name={option.name}
                            onChange={option.onChange}
                            defaultChecked={option.checked}
                            className={stylesGlobal.checkbox_custom_input}
                        />
                        <label htmlFor={option.id} style={{ margin: "0 5px", height: "unset" }} className={stylesGlobal.checkbox_custom_label}>
                            <div
                                tabIndex={0}
                                role="checkbox"
                                aria-checked={option.checked}
                                aria-label={option.label}
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
                                        option.onChange();
                                    }
                                }}
                                className={stylesGlobal.checkbox_custom}
                                style={{ border: option.checked ? "2px solid transparent" : "2px solid var(--color-primary)", backgroundColor: option.checked ? "var(--color-blue)" : "transparent" }}>
                                {option.checked ?
                                    <SVG ariaHidden svg={CheckIcon} />
                                    :
                                    <></>
                                }
                            </div>
                            <span aria-hidden>
                                {option.label}
                            </span>
                        </label>
                    </div>
                </section>

            ))}
        </div>
    );
};

const DivinaSetReadingMode = ({ handleDivinaReadingMode, divinaReadingMode, divinaReadingModeSupported }: Partial<IBaseProps>) => {
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

const PdfZoom = ({ pdfScale /*, pdfView*/ }: Pick<IState, "pdfScale" | "pdfView">) => {
    const [__] = useTranslator();

    const inputComponent = (scale: IPdfPlayerScale/*, disabled = false*/) => {
        return <div>
            <input
                id={"radio-" + `${scale}`}
                type="radio"
                name="pdfZoomRadios"
                onChange={() => createOrGetPdfEventBus().dispatch("scale", scale)}
                checked={pdfScale === scale}
                // disabled={disabled}
            />
            <label
                // aria-disabled={disabled}
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
            {inputComponent("page-width" /* pdfView === "paginated"*/)}
            {inputComponent(50 /* pdfView === "paginated"*/)}
            {inputComponent(100 /* pdfView === "paginated"*/)}
            {inputComponent(150 /* pdfView === "paginated"*/)}
            {inputComponent(200 /* pdfView === "paginated"*/)}
            {inputComponent(300 /* pdfView === "paginated"*/)}
            {inputComponent(500 /* pdfView === "paginated"*/)}
        </div>
    );
};

const AllowCustom = () => {
    const [__] = useTranslator();
    const overridePublisherDefault = useSelector((state: IReaderRootState) => state.reader.allowCustomConfig.state);
    const dispatch = useDispatch();
    const set = React.useCallback(() => {
        dispatch(readerLocalActionReader.allowCustom.build(!overridePublisherDefault));
    }, [dispatch, overridePublisherDefault]);

    return (
        <>
            <input id="allow-custom" className={stylesGlobal.checkbox_custom_input} type="checkbox" checked={overridePublisherDefault} onChange={() => { set(); }} />
            <label htmlFor="allow-custom" className={stylesGlobal.checkbox_custom_label}>
                <div
                    tabIndex={0}
                    role="checkbox"
                    aria-checked={overridePublisherDefault}
                    aria-label={__("reader.settings.customizeReader")}
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
                            set();
                        }
                    }}
                    className={stylesGlobal.checkbox_custom}
                    style={{ border: overridePublisherDefault ? "2px solid transparent" : "2px solid var(--color-primary)", backgroundColor: overridePublisherDefault ? "var(--color-blue)" : "transparent" }}>
                    {overridePublisherDefault ?
                        <SVG ariaHidden svg={CheckIcon} />
                        :
                        <></>
                    }
                </div>
                <span aria-hidden>
                    {__("reader.settings.customizeReader")}
                </span>
            </label>
        </>
    );
};

const SaveResetApplyPreset = () => {

    const dispatch = useDispatch();
    const readerConfig = useSelector((state: IReaderRootState) => state.reader.config);
    const setReaderConfig = useSaveReaderConfig();
    const setPublisherConfig = useSavePublisherReaderConfig();
    const readerDefaultConfig = useSelector((state: IReaderRootState) => state.reader.defaultConfig);
    const allowCustomCheckboxChecked = useSelector((state: IReaderRootState) => state.reader.allowCustomConfig.state);
    const publisherConfigOverrided = !comparePublisherReaderConfig(readerDefaultConfig, readerConfigInitialState);
    const diffBetweenDefaultConfigAndConfig = useDiffBoolBetweenReaderConfigAndDefaultConfig();

    const dockingMode = useReaderConfig("readerDockingMode");
    const dockedMode = dockingMode !== "full";

    const cb = React.useCallback(() => {

        const { ttsVoices: __ttsVoiceUNUSED, readerSettingsSection: __readerSettingsSectionUNUSED, readerMenuSection: __readerMenuSectionUNUSED, ...readerDefaultConfigWithoutSomeDefaultKeys} = readerDefaultConfig;
        setReaderConfig(readerDefaultConfigWithoutSomeDefaultKeys);

        if (allowCustomCheckboxChecked) {
            if (publisherConfigOverrided) {
                setPublisherConfig(readerDefaultConfigWithoutSomeDefaultKeys);
            } else {
                dispatch(readerLocalActionReader.allowCustom.build(false));
            }
        } else {
            if (publisherConfigOverrided) {
                setPublisherConfig(readerDefaultConfigWithoutSomeDefaultKeys);
                dispatch(readerLocalActionReader.allowCustom.build(true));
            } else {
                // nothing to do
            }
        }
    }, [allowCustomCheckboxChecked, dispatch, publisherConfigOverrided, readerDefaultConfig, setPublisherConfig, setReaderConfig]);
    const applyPreferredConfig = React.useMemo(() => debounce(cb, 400), [cb]);

    const [__] = useTranslator();
    return (

        <div className={stylesSettings.preset_settings_container}>
            <div>
                <button className={stylesButtons.button_secondary_blue} style={{maxWidth: dockedMode ? "284px" : "", height: dockedMode ? "fit-content" : "30px"}} onClick={() => {
                    dispatch(readerActions.configSetDefault.build(readerConfig));
                }} disabled={!diffBetweenDefaultConfigAndConfig}>
                    <SVG ariaHidden={true} svg={SaveIcon} />
                    {__("reader.settings.preset.save")}</button>
                <p>{__("reader.settings.preset.saveDetails")}</p>
            </div>

            <div>
                <button className={stylesButtons.button_secondary_blue} style={{maxWidth: dockedMode ? "284px" : "", height: dockedMode ? "fit-content" : "30px"}} onClick={applyPreferredConfig}>
                    <SVG ariaHidden={true} svg={DoubleCheckIcon} />
                    {__("reader.settings.preset.apply")}
                </button>
                <p>{__("reader.settings.preset.applyDetails")}</p>
            </div>

            <div>
                <button className={stylesButtons.button_secondary_blue} style={{maxWidth: dockedMode ? "284px" : "", height: dockedMode ? "fit-content" : "30px"}} onClick={() => {
                    dispatch(readerActions.configSetDefault.build(readerConfigInitialState));
                    applyPreferredConfig();
                }}>
                    <SVG ariaHidden={true} svg={ResetIcon} />
                    {__("reader.settings.preset.reset")}
                </button>
                <p>{__("reader.settings.preset.resetDetails")}</p>
            </div>
        </div>
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
            <h3>{__("reader.settings.text")}</h3>
            {overridePublisherDefault ? <></> : <i>{__("reader.settings.disabled")}</i>}
        </Tabs.Trigger>;
    const optionTextItem = { id: 0, value: "tab-text", name: __("reader.settings.text"), disabled: !overridePublisherDefault, svg: TextAreaIcon };

    const DivinaTrigger =
        <Tabs.Trigger value="tab-divina" disabled={false} title={__("reader.settings.disposition.title")} key={"tab-divina"}>
            <SVG ariaHidden svg={TextAreaIcon} />
            <h3>{__("reader.settings.disposition.title")}</h3>
        </Tabs.Trigger>;
    const optionDivinaItem = { id: 1, value: "tab-divina", name: __("reader.settings.disposition.title"), disabled: false, svg: TextAreaIcon };

    const SpacingTrigger =
        <Tabs.Trigger value="tab-spacing" disabled={!overridePublisherDefault} key={"tab-spacing"} title={__("reader.settings.spacing")} data-value={"tab-spacing"}>
            <SVG ariaHidden svg={LayoutIcon} />
            <h3>{__("reader.settings.spacing")}</h3>
            {overridePublisherDefault ? <></> : <i>{__("reader.settings.disabled")}</i>}
        </Tabs.Trigger>;
    const optionSpacingItem = { id: 2, value: "tab-spacing", name: __("reader.settings.spacing"), disabled: !overridePublisherDefault, svg: LayoutIcon };

    const DisplayTrigger =
        <Tabs.Trigger value="tab-display" key={"tab-display"} title={__("reader.settings.display")}>
            <SVG ariaHidden svg={AlignLeftIcon} />
            <h3>{__("reader.settings.display")}</h3>
        </Tabs.Trigger>;
    const optionDisplayItem = { id: 3, value: "tab-display", name: __("reader.settings.display"), disabled: false, svg: AlignLeftIcon };

    // const AudioTrigger =
    //     <Tabs.Trigger value="tab-audio" key={"tab-audio"} title={__("reader.media-overlays.title")}>
    //         <SVG ariaHidden svg={VolumeUpIcon} />
    //         <h3>{__("reader.media-overlays.title")}</h3>
    //     </Tabs.Trigger>;
    // const optionAudioItem = { id: 4, value: "tab-audio", name: __("reader.media-overlays.title"), disabled: false, svg: VolumeUpIcon };

    const PdfZoomTrigger =
        <Tabs.Trigger value="tab-pdfzoom" key={"tab-pdfzoom"} title={__("reader.settings.pdfZoom.title")}>
            <SVG ariaHidden svg={VolumeUpIcon} />
            <h3>{__("reader.settings.pdfZoom.title")}</h3>
        </Tabs.Trigger>;
    const optionPdfZoomItem = { id: 5, value: "tab-pdfzoom", name: __("reader.settings.pdfZoom.title"), disabled: false, svg: VolumeUpIcon };

    const PresetTrigger =
        <React.Fragment key="tab-preset">
            <span style={{ width: "80%", height: "2px", backgroundColor: "var(--color-extralight-grey-alt)", margin: "10px auto" }}></span>
            <Tabs.Trigger value="tab-preset" disabled={false} title={__("reader.settings.preset.title")} data-value="tab-preset" style={{position: "relative"}}>
                <SVG ariaHidden svg={GuearIcon} />
                <h3>{__("reader.settings.preset.title")}</h3>
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
                style={{ margin: "0", padding: (dockedMode && isEpub) ? "10px 0" : "0", flexDirection: "row", backgroundColor: "var(--color-docked-header)" }}
                ref={dockedModeRef}
            >
                {item => <ComboBoxItem>{item.name}</ComboBoxItem>}
            </SelectRef>
        );
    };

    const TabHeader = () => {

        return (
            dockedMode ? <></> :
                <div key="modal-header" className={stylesSettings.close_button_div}>
                    <TabTitle value={section} />
                    <div>
                        <button className={stylesButtons.button_transparency_icon} aria-label={__("reader.svg.left")} onClick={setDockingModeLeftSide}>
                            <SVG ariaHidden={true} svg={DockLeftIcon} />
                        </button>
                        <button className={stylesButtons.button_transparency_icon} aria-label={__("reader.svg.right")} onClick={setDockingModeRightSide}>
                            <SVG ariaHidden={true} svg={DockRightIcon} />
                        </button>
                        <button className={stylesButtons.button_transparency_icon} disabled aria-label={__("reader.settings.column.auto")} onClick={setDockingModeFull}>
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
            {
                dockedMode ?
                    <>
                        <div key="docked-header" className={stylesPopoverDialog.docked_header}>
                            {
                                (dockedMode && isEpub) ? <AllowCustomContainer /> : <SelectRefComponent />
                            }
                            <div key="docked-header-btn" className={stylesPopoverDialog.docked_header_controls}>
                                <button className={stylesButtons.button_transparency_icon} disabled={dockingMode === "left" ? true : false} aria-label={__("reader.svg.left")} onClick={setDockingModeLeftSide}>
                                    <SVG ariaHidden={true} svg={DockLeftIcon} />
                                </button>
                                <button className={stylesButtons.button_transparency_icon} disabled={dockingMode === "right" ? true : false} aria-label={__("reader.svg.right")} onClick={setDockingModeRightSide}>
                                    <SVG ariaHidden={true} svg={DockRightIcon} />
                                </button>
                                <button className={stylesButtons.button_transparency_icon} disabled={false} aria-label={__("reader.settings.column.auto")} onClick={setDockingModeFull}>
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
                    : <></>
            }
            <Tabs.Root value={section} defaultValue={section} onValueChange={dockedMode ? null : setSection} data-orientation="vertical" orientation="vertical" className={stylesSettings.settings_container}>
                {
                    dockedMode ? <></> :
                        <Tabs.List id="reader-settings-nav" ref={tabModeRef} className={stylesSettings.settings_tabslist} aria-orientation="vertical" data-orientation="vertical">
                            {sections}
                        </Tabs.List>
                }
                <div className={stylesSettings.settings_content}
                    style={{ marginTop: dockedMode && "0" }}>
                    <Tabs.Content value="tab-divina" tabIndex={-1} id="readerSettings_tabs-tab-divina" className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE">
                        <TabHeader />
                        <div className={stylesSettings.settings_tab}>
                            <DivinaSetReadingMode handleDivinaReadingMode={handleDivinaReadingMode} divinaReadingMode={divinaReadingMode} divinaReadingModeSupported={divinaReadingModeSupported} />
                        </div>
                    </Tabs.Content>
                    <Tabs.Content value="tab-pdfzoom" tabIndex={-1} id="readerSettings_tabs-tab-pdfzoom" className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE">
                        <TabHeader />
                        <div className={stylesSettings.settings_tab}>
                            <PdfZoom pdfScale={props.pdfPlayerZoom} /*pdfView={pdfView}*/ />
                        </div>
                    </Tabs.Content>
                    <Tabs.Content value="tab-text" tabIndex={-1} id="readerSettings_tabs-tab-text" className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE">
                        <TabHeader />
                        <div className={classNames(stylesSettings.settings_tab, stylesSettings.settings_reading_text, stylesSettings.section)}>
                            <FontSize />
                            <FontFamily />
                        </div>
                    </Tabs.Content>
                    <Tabs.Content value="tab-spacing" tabIndex={-1} id="readerSettings_tabs-tab-spacing" className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE">
                        <TabHeader />
                        <div className={stylesSettings.settings_tab}>
                            <ReadingSpacing />
                        </div>
                    </Tabs.Content>
                    <Tabs.Content value="tab-display" tabIndex={-1} id="readerSettings_tabs-tab-display" className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE">
                        <TabHeader />
                        <section className={stylesSettings.settings_tab}>
                            {isPdf ? <></> : <Theme dockedMode={dockedMode} />}
                            {isPdf ? <></> : <ReadingDisplayLayout isFXL={props.isFXL} />}
                            {isPdf ? <></> : <ReadingDisplayAlign />}
                            <ReadingDisplayCol isPdf={props.isPdf} pdfCol={props.pdfPlayerSpreadMode === 0 ? "1" : props.pdfPlayerSpreadMode > 0 ? "2" : "1" /* OR "auto" */} spreadModeEven={props.pdfPlayerSpreadMode === 2} />
                            {isPdf ? <></> : <ReadingDisplayCheckboxSettings disableRTLFlip={props.disableRTLFlip} setDisableRTLFlip={props.setDisableRTLFlip} />}
                        </section>
                    </Tabs.Content>
                    <Tabs.Content value="tab-preset" tabIndex={-1} id="readerSettings_tab-preset" className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE">
                        <TabHeader />
                        <section className={stylesSettings.settings_tab}>
                            <SaveResetApplyPreset />
                        </section>
                    </Tabs.Content>
                </div>
            </Tabs.Root>
        </div>
    );
};
