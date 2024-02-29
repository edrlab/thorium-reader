// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ReaderConfig } from "readium-desktop/common/models/reader";
import { FONT_ID_DEFAULT } from "readium-desktop/utils/fontList";

export const readerConfigInitialState: ReaderConfig = {
    align: "auto",
    colCount: "auto",
    dark: false,
    font: FONT_ID_DEFAULT,
    fontSize: "100%",
    invert: false,
    lineHeight: "0",
    night: false,
    paged: true, // https://github.com/edrlab/thorium-reader/issues/1222
    readiumcss: true,
    sepia: false,
    enableMathJax: false,
    reduceMotion: false,
    noFootnotes: false,
    noRuby: false,
    pageMargins: "0.5",
    wordSpacing: "0",
    letterSpacing: "0",
    paraSpacing: "0",
    darken: undefined,
    mediaOverlaysEnableSkippability: true,
    ttsEnableSentenceDetection: true,
    mediaOverlaysEnableCaptionsMode: false,
    ttsEnableOverlayMode: false,
};
