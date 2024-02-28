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

export const FONT_LIST: Font[] =
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
const FONT_LIST_JA: Font[] =
[{
    id: "JA",
    label: "日本語 SERIF (H)",
    // eslint-disable-next-line quotes
    fontFamily: `"ＭＳ Ｐ明朝", "MS PMincho", "Hiragino Mincho Pro", "ヒラギノ明朝 Pro W3", "游明朝", "YuMincho", "ＭＳ 明朝", "MS Mincho", "Hiragino Mincho ProN", serif`,
}, {
    id: "JA-SANS",
    label: "日本語 SANS (H)",
    // eslint-disable-next-line quotes
    fontFamily: `"ＭＳ Ｐゴシック", "MS PGothic", "Hiragino Kaku Gothic Pro W3", "ヒラギノ角ゴ Pro W3", "Hiragino Sans GB", "ヒラギノ角ゴシック W3", "游ゴシック", "YuGothic", "ＭＳ ゴシック", "MS Gothic", "Hiragino Sans", sans-serif`,
}, {
    id: "JA-V",
    label: "日本語 SERIF (V)",
    // eslint-disable-next-line quotes
    fontFamily: `"ＭＳ 明朝", "MS Mincho", "Hiragino Mincho Pro", "ヒラギノ明朝 Pro W3", "游明朝", "YuMincho", "ＭＳ Ｐ明朝", "MS PMincho", "Hiragino Mincho ProN", serif`,
}, {
    id: "JA-V-SANS",
    label: "日本語 SANS (V)",
    // eslint-disable-next-line quotes
    fontFamily: `"ＭＳ ゴシック", "MS Gothic", "Hiragino Kaku Gothic Pro W3", "ヒラギノ角ゴ Pro W3", "Hiragino Sans GB", "ヒラギノ角ゴシック W3", "游ゴシック", "YuGothic", "ＭＳ Ｐゴシック", "MS PGothic", "Hiragino Sans", sans-serif`,
}];
const FONT_LIST_WITH_JA_ = [].concat(...FONT_LIST);
export const FONT_LIST_WITH_JA = FONT_LIST_WITH_JA_.push(...FONT_LIST_WITH_JA_.splice(FONT_LIST_WITH_JA_.length - 1, 1, ...FONT_LIST_JA)) && FONT_LIST_WITH_JA_;
