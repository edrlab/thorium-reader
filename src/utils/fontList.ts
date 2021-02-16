// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Font } from "readium-desktop/common/models/font";

// UNCOMMENT THIS TO TRY webpack-loader-scope-checker.js (build-time error for library/reader code leakage)
// import { diRendererSymbolTable } from "readium-desktop/renderer/library/diSymbolTable";
// console.log(diRendererSymbolTable["react-library-app"]);

export const FONT_ID_DEFAULT = "DEFAULT";
export const FONT_ID_VOID = "VOID";

const fontList: Font[] =
[{
    id: FONT_ID_DEFAULT,
    label: "Default font",
}, {
    id: "OLD",
    label: "Old Style",
    fontFamily: "\"Iowan Old Style\", \"Sitka Text\", Palatino, \"Book Antiqua\", serif",
}, {
    id: "MODERN",
    label: "Modern",
    fontFamily: "Athelas, Constantia, Georgia, serif",
}, {
    id: "SANS",
    label: "Sans",
    // tslint:disable-next-line:max-line-length
    fontFamily: "-apple-system, system-ui, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
}, {
    id: "HUMAN",
    label: "Humanist",
    fontFamily: "Seravek, Calibri, Roboto, Arial, sans-serif",
}, {
    id: "DYS",
    label: "Readable (dys)",
    fontFamily: "AccessibleDfa",
}, {
    id: "DUO",
    label: "Duospace",
    fontFamily: "\"IA Writer Duospace\", Consolas, monospace",
}, {
    id: "MONO",
    label: "Monospace",
    fontFamily: "\"Andale Mono\", Consolas, monospace",
}, {
    id: FONT_ID_VOID,
    label: "...",
    fontFamily: "Consolas, monospace",
}];

export default fontList;
