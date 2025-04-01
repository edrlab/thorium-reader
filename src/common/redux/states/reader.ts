// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { IAnnotationReaderConfigState, IReaderConfigSettingsMenuState, ReaderConfig, ReaderTTSMediaOverlay } from "readium-desktop/common/models/reader";
import { FONT_ID_DEFAULT } from "readium-desktop/utils/fontList";
import { HighlightDrawTypeBackground, HighlightDrawTypeUnderline } from "@r2-navigator-js/electron/common/highlight";
import { NOTE_DEFAULT_COLOR_OBJ } from "./renderer/note";


export const readerConfigInitialStateTTSMediaOverlay: ReaderTTSMediaOverlay = {
    ttsPlaybackRate: "1",
    ttsVoices: [],
    mediaOverlaysPlaybackRate: "1",
};

export const readerConfigInitialStateDefaultPublisher = {
    font: FONT_ID_DEFAULT,
    fontSize: "100%",
    pageMargins: "1",
    wordSpacing: "0",
    letterSpacing: "0",
    paraSpacing: "0",
    lineHeight: "0",
};

export const readerConfigInitialStateAnnotation: IAnnotationReaderConfigState = {
    annotation_defaultColor: { ...NOTE_DEFAULT_COLOR_OBJ },
    annotation_defaultDrawType: "solid_background",
    annotation_popoverNotOpenOnNoteTaking: false,
    annotation_defaultDrawView: "annotation",
};

export const readerConfigInitialStateReaderDockingMode: IReaderConfigSettingsMenuState = {
    readerDockingMode: "full",
    readerMenuSection: "tab-toc",
    readerSettingsSection: "tab-display",
};

export const readerConfigInitialState: ReaderConfig = {
    align: "auto",
    colCount: "auto",
    dark: false,
    invert: false,
    night: false,
    paged: true, // https://github.com/edrlab/thorium-reader/issues/1222
    readiumcss: true,
    sepia: false,
    theme: "neutral",
    enableMathJax: false,
    reduceMotion: false,
    noFootnotes: false,
    noTemporaryNavTargetOutline: false,
    noRuby: false,
    darken: undefined,
    ttsAndMediaOverlaysDisableContinuousPlay: false,

    ttsHighlightStyle: HighlightDrawTypeBackground,
    ttsHighlightStyle_WORD: HighlightDrawTypeUnderline,
    // HighlightDrawTypeBackground
    // HighlightDrawTypeUnderline
    // HighlightDrawTypeStrikethrough
    // HighlightDrawTypeOutline
    // HighlightDrawTypeOpacityMask
    // HighlightDrawTypeOpacityMaskRuler

    // see defaultCopy in src/common/redux/actions/reader/configSetDefault.ts
    ttsHighlightColor: {
        blue: 116, // 204,
        green: 248, // 218,
        red: 248, // 255,
    },
    // see defaultCopy in src/common/redux/actions/reader/configSetDefault.ts
    ttsHighlightColor_WORD: {
        blue: 0,
        green: 147,
        red: 255,
    },

    mediaOverlaysEnableSkippability: true,
    mediaOverlaysIgnoreAndUseTTS: false,
    ttsEnableSentenceDetection: true,
    mediaOverlaysEnableCaptionsMode: false,
    ttsEnableOverlayMode: false,
    ...readerConfigInitialStateDefaultPublisher,
    ...readerConfigInitialStateAnnotation,
    ...readerConfigInitialStateReaderDockingMode,
    ...readerConfigInitialStateTTSMediaOverlay,
};
