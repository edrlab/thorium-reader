// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { IReaderSettingsMenuState, ReaderConfig } from "readium-desktop/common/models/reader";
import { FONT_ID_DEFAULT } from "readium-desktop/utils/fontList";
import { IAnnotationReaderConfigState, IColor } from "./renderer/annotation";

export const DEFAULT_COLOR_ANNOTATION: IColor = {red: 235, green: 150, blue: 148};

export const readerConfigInitialStateTTSMediaOverlay = {
    ttsPlaybackRate: "1",
    ttsVoice: null as SpeechSynthesisVoice,
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
    annotation_defaultColor: DEFAULT_COLOR_ANNOTATION,
    annotation_defaultDrawType: "solid_background",
    annotation_popoverNotOpenOnNoteTaking: false,
    annotation_defaultDrawView: "annotation",
};

export const readerConfigInitialStateReaderDockingMode: IReaderSettingsMenuState = {
    readerDockingMode: "full",
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
    noRuby: false,
    darken: undefined,
    mediaOverlaysEnableSkippability: true,
    ttsEnableSentenceDetection: true,
    mediaOverlaysEnableCaptionsMode: false,
    ttsEnableOverlayMode: false,
    ...readerConfigInitialStateDefaultPublisher,
    ...readerConfigInitialStateAnnotation,
    ...readerConfigInitialStateReaderDockingMode,
    ...readerConfigInitialStateTTSMediaOverlay,
};
