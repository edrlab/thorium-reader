// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.scss";
import * as stylesReader from "readium-desktop/renderer/assets/styles/reader-app.scss";
import * as stylesAnnotations from "readium-desktop/renderer/assets/styles/components/annotations.scss";

import * as React from "react";
import { ComboBox, ComboBoxItem } from "readium-desktop/renderer/common/components/ComboBox";

import SVG from "readium-desktop/renderer/common/components/SVG";
import * as DoubleCheckIcon from "readium-desktop/renderer/assets/icons/doubleCheck-icon.svg";
import * as CheckIcon from "readium-desktop/renderer/assets/icons/singlecheck-icon.svg";

import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { readerConfigInitialState } from "readium-desktop/common/redux/states/reader";
import { useReaderConfigAll, useSaveReaderConfigDebounced } from "readium-desktop/renderer/common/hooks/useReaderConfig";
import { HighlightDrawTypeBackground, HighlightDrawTypeUnderline, HighlightDrawTypeOutline, HighlightDrawTypeOpacityMask, HighlightDrawTypeOpacityMaskRuler } from "@r2-navigator-js/electron/common/highlight";
import { TTSStateEnum } from "@r2-navigator-js/electron/renderer/readaloud";
import { hexToRgb, rgbToHex } from "readium-desktop/common/rgb";
import { TTranslatorKeyParameter } from "readium-desktop/typings/en.translation-keys";
import { noteColorCodeToColorTranslatorKeySet } from "readium-desktop/common/redux/states/renderer/note";


// WARNING: Do not remove these references; they are required by the i18n scanner/checker.
// __("reader.notes.colors.darkyellow");
// __("reader.notes.colors.darkorange");

const noteColorCodeToColorTranslatorKeySet_ = {
    ["#000000"]: "publication.accessibility.accessibilityHazard.none" as TTranslatorKeyParameter,
    [rgbToHex(readerConfigInitialState.ttsHighlightColor)]: "reader.notes.colors.darkyellow" as TTranslatorKeyParameter,
    [rgbToHex(readerConfigInitialState.ttsHighlightColor_WORD)]: "reader.notes.colors.darkorange" as TTranslatorKeyParameter,
    ...noteColorCodeToColorTranslatorKeySet,
};

export const ReadingAudio = ({ useMO, ttsState, ttsPause, ttsResume }: { useMO: boolean, ttsState: TTSStateEnum, ttsPause: () => void, ttsResume: () => void }) => {
    const [__] = useTranslator();

    // : Pick<ReaderConfig, "ttsEnableOverlayMode" | "mediaOverlaysEnableCaptionsMode" | "ttsAndMediaOverlaysDisableContinuousPlay" | "mediaOverlaysEnableSkippability" | "ttsEnableSentenceDetection">
    const config = useReaderConfigAll();
    const { ttsHighlightStyle, ttsHighlightStyle_WORD, ttsHighlightColor, ttsHighlightColor_WORD, mediaOverlaysEnableCaptionsMode: moCaptions, ttsEnableOverlayMode: ttsCaptions, ttsAndMediaOverlaysDisableContinuousPlay: disableContinuousPlay, mediaOverlaysEnableSkippability: skippability, mediaOverlaysIgnoreAndUseTTS, mediaOverlaysUseTTSHighlights, ttsEnableSentenceDetection: splitTTStext } = config;
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
        options.push({
            id: "useTTSHighlightsForMO",
            name: "useTTSHighlightsForMO",
            label: `${__("reader.media-overlays.useTTSHighlightsForMO")}`,
            description: `${__("reader.media-overlays.useTTSHighlightsForMODescription")}`,
            checked: mediaOverlaysUseTTSHighlights,
            onChange: () => {
                set({ mediaOverlaysUseTTSHighlights: !mediaOverlaysUseTTSHighlights });
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

    let ttsHighlightColor_HEX = rgbToHex(ttsHighlightColor_);
    if (ttsHighlightColor_HEX === "#000000") {
        ttsHighlightColor_HEX = "transparent";
    }
    const styleSentence = {
        background:
            ttsHighlightStyle_ === HighlightDrawTypeBackground ?
                ttsHighlightColor_HEX :
                undefined,
        textDecorationLine:
            ttsHighlightStyle_ === HighlightDrawTypeUnderline ?
                "underline" :
                undefined,
        textDecorationColor:
            ttsHighlightStyle_ === HighlightDrawTypeUnderline ?
                ttsHighlightColor_HEX :
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
                ttsHighlightColor_HEX :
                undefined,
        color: "black",
    } satisfies React.CSSProperties;

    let ttsHighlightColor_WORD_HEX = rgbToHex(ttsHighlightColor_WORD_);
    if (useMO || ttsHighlightColor_WORD_HEX === "#000000") {
        ttsHighlightColor_WORD_HEX = "transparent";
    }
    const styleWord = {
        background:
            ttsHighlightStyle_WORD_ === HighlightDrawTypeBackground ?
                ttsHighlightColor_WORD_HEX :
                undefined,
        textDecorationLine:
            ttsHighlightStyle_WORD_ === HighlightDrawTypeUnderline ?
                "underline" :
                undefined,
        textDecorationColor:
            ttsHighlightStyle_WORD_ === HighlightDrawTypeUnderline ?
                ttsHighlightColor_WORD_HEX :
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
                ttsHighlightColor_WORD_HEX :
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
                                style={{ border: option.checked ? "2px solid transparent" : "2px solid var(--color-text-primary)", backgroundColor: option.checked ? "var(--color-brand-primary)" : "transparent" }}>
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

            {
                !useMO || mediaOverlaysUseTTSHighlights ?
                    (
                        <>
                            <div style={{ border: "2px dotted var(--color-gray-250)", borderRadius: "1em", padding: 6 }}>
                                <div className={stylesReader.ttsSelectRate}>
                                    <ComboBox label={__("tts.highlight.style")}
                                        defaultItems={ttsHighlightStyles}
                                        defaultSelectedKey={ttsHighlightStylesKey === -1 ? 0 : ttsHighlightStylesKey}
                                        selectedKey={ttsHighlightStylesKey === -1 ? 0 : ttsHighlightStylesKey}
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
                                    <p style={{ marginBottom: 4, paddingBottom: 0, fontWeight: "bold", fontSize: "120%" }}>{__("tts.highlight.mainColor")}</p>
                                    <div style={{ width: "fit-content" }} className={stylesAnnotations.colorPicker} role="radiogroup">
                                        {
                                            Object.entries(noteColorCodeToColorTranslatorKeySet_).map(([colorHex, translatorKey]) => {
                                                const ttsHighlightColorHex = rgbToHex(ttsHighlightColor || readerConfigInitialState.ttsHighlightColor);
                                                return (
                                                    <div key={`color_${colorHex}_key`}>
                                                        <input type="radio" id={`ttscolorpick${colorHex}`} name="ttscolorpick" value={colorHex}
                                                            onChange={() => {
                                                                ttsTogglePlayResume(() => {
                                                                    set({ ttsHighlightColor: hexToRgb(colorHex) });
                                                                    // if (colorHex === "#000000") {
                                                                    //     set({ ttsHighlightColor: hexToRgb(colorHex), ttsHighlightStyle: HighlightDrawTypeNONE });
                                                                    // } else {
                                                                    //     set({ ttsHighlightColor: hexToRgb(colorHex), ttsHighlightStyle_WORD: ttsHighlightStyle_PREVIOUS || readerConfigInitialState.ttsHighlightStyle });
                                                                    // }
                                                                });
                                                            }}
                                                            checked={ttsHighlightColorHex === colorHex}
                                                            aria-label={__(translatorKey)}
                                                        />
                                                        <label aria-hidden={true} title={__(translatorKey)} htmlFor={`ttscolorpick${colorHex}`}
                                                            style={{
                                                                background: colorHex === "#000000" ? "linear-gradient(90deg,rgba(255, 255, 255, 1) 0%, rgba(71, 71, 71, 1) 50%, rgba(0, 0, 0, 1) 100%)" : undefined,
                                                                backgroundColor: colorHex === "#000000" ? undefined : colorHex,
                                                                border: ttsHighlightColorHex === colorHex ? "1px solid var(--color-gray-900)" : "",
                                                            }}
                                                        >
                                                            {ttsHighlightColorHex === colorHex ? <SVG ariaHidden svg={DoubleCheckIcon} /> : <></>}
                                                        </label>
                                                    </div>
                                                );
                                            })
                                        }
                                    </div>
                                    <p style={{ textDecoration: useMO ? "line-through" : undefined, marginBottom: 4, paddingBottom: 0, fontWeight: "bold", fontSize: "120%" }}>{__("tts.highlight.wordColor")}</p>
                                    <div style={{ filter: useMO ? "grayscale(100%)" : undefined, width: "fit-content" }} className={stylesAnnotations.colorPicker} role="radiogroup">
                                        {
                                            Object.entries(noteColorCodeToColorTranslatorKeySet_).map(([colorHex, translatorKey]) => {
                                                const ttsHighlightColor_WORDHex = rgbToHex(ttsHighlightColor_WORD || readerConfigInitialState.ttsHighlightColor_WORD);
                                                return (
                                                    <div key={`colorx_${colorHex}_key`}>
                                                        <input disabled={useMO ? true : undefined} type="radio" id={`ttscolorpickword${colorHex}`} name="ttscolorpickword" value={colorHex}
                                                            onChange={() => {
                                                                ttsTogglePlayResume(() => {
                                                                    set({ ttsHighlightColor_WORD: hexToRgb(colorHex) });
                                                                    // if (colorHex === "#000000") {
                                                                    //     set({ ttsHighlightColor_WORD: hexToRgb(colorHex), ttsHighlightStyle_WORD: HighlightDrawTypeNONE });
                                                                    // } else {
                                                                    //     set({ ttsHighlightColor_WORD: hexToRgb(colorHex), ttsHighlightStyle_WORD: ttsHighlightStyle_WORD_PREVIOUS || readerConfigInitialState.ttsHighlightStyle_WORD });
                                                                    // }
                                                                });
                                                            }}
                                                            checked={ttsHighlightColor_WORDHex === colorHex}
                                                            aria-label={__(translatorKey)}
                                                        />
                                                        <label aria-hidden={true} title={__(translatorKey)} htmlFor={`ttscolorpickword${colorHex}`}
                                                            style={{
                                                                cursor: useMO ? "not-allowed" : undefined,
                                                                background: colorHex === "#000000" ? "linear-gradient(90deg,rgba(255, 255, 255, 1) 0%, rgba(71, 71, 71, 1) 50%, rgba(0, 0, 0, 1) 100%)" : undefined,
                                                                backgroundColor: colorHex === "#000000" ? undefined : colorHex,
                                                                border: ttsHighlightColor_WORDHex === colorHex ? "1px solid var(--color-gray-900)" : "",
                                                            }}
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
                            <div style={{ flexBasis: "100%", height: 0 }}></div>
                            <details
                                aria-hidden={true}
                                open={false}>
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
                                                    }>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas nec purus sodales, rhoncus nisl ac,</span><br />
                                                    <div style={
                                                        {
                                                            border: "2px solid black",
                                                            borderRadius: "8px",
                                                            padding: "4px",
                                                        }
                                                    }><span>fringilla metus.</span> <span style={styleSentence}>Sed eu dignissim dui. <span style={styleWord}>Curabitur</span> venenatis sollicitudin ultrices. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.</span> <span>Aenean laoreet justo vitae</span><br /></div>
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
                    : (<></>)
            }
        </>
    );
};
