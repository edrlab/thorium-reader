// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// undefined means *remove* the ReadiumCSS property.
// (the low-level ReadiumCSS logic has its own defaults when a property is not explicitly set,
// see readiumCSSDefaults below for suggested default values to be used on the client side)
export interface IReadiumCSS {
    paged: boolean | undefined;
    colCount: colCountEnum | undefined;

    textAlign: textAlignEnum | undefined;

    lineHeight: string | undefined;
    letterSpacing: string | undefined;
    wordSpacing: string | undefined;

    pageMargins: string | undefined;

    paraIndent: string | undefined;
    paraSpacing: string | undefined;

    bodyHyphens: bodyHyphensEnum | undefined;

    backgroundColor: string | undefined;
    textColor: string | undefined;
    selectionBackgroundColor: string | undefined;
    selectionTextColor: string | undefined;
    linkColor: string | undefined;
    linkVisitedColor: string | undefined;

    ligatures: ligaturesEnum | undefined;

    font: fontEnum | string | undefined;
    fontSize: string | undefined;
    typeScale: string | undefined;

    darken: boolean | undefined;
    invert: boolean | undefined;

    night: boolean | undefined;
    sepia: boolean | undefined;

    a11yNormalize: boolean | undefined;

    noFootnotes: boolean | undefined;

    noTemporaryNavTargetOutline: boolean | undefined;

    noRuby: boolean | undefined;

    mathJax: boolean | undefined;

    reduceMotion: boolean | undefined;

    // audioPlaybackRate: number | undefined;
}

export enum bodyHyphensEnum {
    auto = "auto",
    none = "none",
}
export enum colCountEnum {
    auto = "auto",
    one = "1",
    two = "2",
}
export enum ligaturesEnum {
    none = "none",
    common_ligatures = "common-ligatures", // for Arabic RTL
}
export enum textAlignEnum {
    left = "left",
    right = "right",
    justify = "justify",
    // center = "center",
    start = "start", // auto left/right based on dir
}
export enum fontEnum {
    DEFAULT = "DEFAULT",
    DUO = "DUO", // "IA Writer Duospace"
    DYS = "DYS", // "AccessibleDfA"
    OLD = "OLD", // "oldStyleTf"
    MODERN = "MODERN", // "modernTf"
    SANS = "SANS", // "sansTf"
    HUMAN = "HUMAN", // "humanistTf"
    MONO = "MONO", // "monospaceTf"
    JA = "JA", // "serif-ja"
    JA_SANS = "JA-SANS", // "sans-serif-ja"
    JA_V = "JA-V", // "serif-ja-v"
    JA_V_SANS = "JA-V-SANS", // "sans-serif-ja-v"
}

// suggested settings
// https://github.com/readium/readium-css/blob/develop/docs/ReadiumCSS-user_variables.css
// https://github.com/readium/readium-css/blob/develop/docs/CSS12-user_prefs.md#list-of-variables
// https://github.com/readium/readium-css/blob/develop/docs/CSS19-api.md#user-settings
export const readiumCSSDefaults = {
    a11yNormalize: false,

    bodyHyphens: bodyHyphensEnum.auto,

    colCount: colCountEnum.auto,

    darken: false,

    font: fontEnum.DEFAULT, // or undefined

    // tslint:disable-next-line:max-line-length
    // 12 = 75%, 14 = 87.5%, 16 = 100%, 18 = 112.5%, 22 = 137.5%, 24 = 150%, 26 = 162.5%, 28 = 175%, 32 = 200%, 36 = 225%, 40 = 250%
    // 75% | 87.5% | 100% | 112.5% | 137.5% | 150% | 162.5% | 175% | 200% | 225% | 250%
    fontSize: "100%",

    invert: false,

    // 0 | 0.0675rem | 0.125rem | 0.1875rem | 0.25rem | ... 0.5rem
    letterSpacing: undefined,

    ligatures: ligaturesEnum.none,

    // 1 | 1.125 | 1.25 | 1.35 | 1.5 | 1.65 | 1.75 | 2
    lineHeight: undefined,

    night: false,

    noFootnotes: false,

    noTemporaryNavTargetOutline: false,

    noRuby: false,

    mathJax: false,

    // 0.5 | 0.75 | 1 | 1.25 | 1.5 | 1.75 | 2
    pageMargins: undefined, // or 1

    paged: false,

    // 0 | 0.5rem | 1rem | 1.25rem | 1.5rem | 2rem | 2.5rem | 3rem
    paraIndent: undefined,

    // 0 | 0.375rem | 0.75rem | 1rem | 1.125rem | 1.25rem | 1.35rem | 1.5rem | 1.65rem | 1.75rem | 2rem
    paraSpacing: undefined,

    reduceMotion: false,

    // 2, 1.75, 1.5, 1, 0.75, 0.5, 0.25
    // audioPlaybackRate: 1,

    sepia: false,

    textAlign: textAlignEnum.start,

    textColor: undefined,
    backgroundColor: undefined,

    selectionBackgroundColor: undefined,
    selectionTextColor: undefined,

    linkColor: undefined,
    linkVisitedColor: undefined,

    // 1 | 1.067 | 1.125 | 1.2 | 1.25 | 1.333 | 1.414 | 1.5 | 1.618
    typeScale: undefined, // or 1.2

    // 0 | 0.0675rem | 0.125rem | 0.1875rem | 0.25rem | 0.3125rem | 0.375rem | 0.4375rem | 0.5rem | 1rem
    wordSpacing: undefined,
} as IReadiumCSS;

export const READIUM_CSS_URL_PATH = "readium-css";
