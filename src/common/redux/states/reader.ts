// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ReaderConfig } from "readium-desktop/common/models/reader";

export const readerConfigInitialState: ReaderConfig = {
    align: "auto",
    colCount: "auto",
    dark: false,
    font: "DEFAULT",
    fontSize: "100%",
    invert: false,
    lineHeight: "1.5",
    night: false,
    paged: false,
    readiumcss: true,
    sepia: false,
    enableMathJax: false,
    pageMargins: undefined,
    wordSpacing: undefined,
    letterSpacing: undefined,
    paraSpacing: undefined,
    noFootnotes: undefined,
    darken: undefined,
};
