// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ReaderConfig } from "readium-desktop/common/models/reader";

import { IEventPayload_R2_EVENT_READIUMCSS } from "@r2-navigator-js/electron/common/events";
import {
    colCountEnum, IReadiumCSS, readiumCSSDefaults, textAlignEnum,
} from "@r2-navigator-js/electron/common/readium-css-settings";

export const computeReadiumCssJsonMessage = (settings: ReaderConfig): IEventPayload_R2_EVENT_READIUMCSS => {

    const cssJson: IReadiumCSS = {

        a11yNormalize: readiumCSSDefaults.a11yNormalize,

        bodyHyphens: readiumCSSDefaults.bodyHyphens,

        colCount: settings.colCount === "1" ? colCountEnum.one :
            (settings.colCount === "2" ? colCountEnum.two : colCountEnum.auto),

        darken: settings.darken,

        font: settings.font,

        fontSize: settings.fontSize,

        invert: settings.invert,

        letterSpacing: settings.letterSpacing,

        ligatures: readiumCSSDefaults.ligatures,

        lineHeight: settings.lineHeight,

        pageMargins: settings.pageMargins,

        paged: settings.paged,

        paraIndent: readiumCSSDefaults.paraIndent,

        paraSpacing: settings.paraSpacing,

        night: settings.night || settings.theme === "night",
        sepia: settings.sepia || settings.theme !== "neutral" && settings.theme !== "night", // settings.theme === "sepia", ReadiumCSS hack to enforce links and headings

        backgroundColor: (!settings.theme || settings.theme === "neutral") ? readiumCSSDefaults.backgroundColor :
            settings.theme === "sepia" ? "#faf4e8" :
            settings.theme === "night" ? "#121212" :
            settings.theme === "paper" ? "#F8EDDF" :
            settings.theme === "contrast1" ? "#000000" :
            settings.theme === "contrast2" ? "#000000" :
            settings.theme === "contrast3" ? "#181842" :
            settings.theme === "contrast4" ? "#C5E7CD" :
            readiumCSSDefaults.backgroundColor,
        textColor: (!settings.theme || settings.theme === "neutral") ? readiumCSSDefaults.textColor :
            settings.theme === "sepia" ? "black" :
            settings.theme === "night" ? "#fff" :
            settings.theme === "paper" ? "#000000" :
            settings.theme === "contrast1" ? "#fff" :
            settings.theme === "contrast2" ? "#FFFF00" :
            settings.theme === "contrast3" ? "#FFFF" :
            settings.theme === "contrast4" ? "#000000" :
            readiumCSSDefaults.textColor,

        selectionBackgroundColor: (!settings.theme || settings.theme === "neutral") ? readiumCSSDefaults.selectionBackgroundColor :
            settings.theme === "sepia" ? "rgb(155, 179, 240)" : // ReadiumCSS standard is #b4d8fe
            settings.theme === "night" ? "rgb(100, 122, 177)" : // #181842
            settings.theme === "paper" ? "rgb(155, 179, 240)" :
            settings.theme === "contrast1" ? "rgb(100, 122, 177)" :
            settings.theme === "contrast2" ? "rgb(100, 122, 177)" :
            settings.theme === "contrast3" ? "rgb(100, 122, 177)" :
            settings.theme === "contrast4" ? "rgb(155, 179, 240)" :
            readiumCSSDefaults.selectionBackgroundColor,
        selectionTextColor: (!settings.theme || settings.theme === "neutral") ? readiumCSSDefaults.selectionTextColor :
            settings.theme === "sepia" ? "inherit" :
            settings.theme === "night" ? "inherit" :
            settings.theme === "paper" ? "inherit" :
            settings.theme === "contrast1" ? "inherit" :
            settings.theme === "contrast2" ? "inherit" :
            settings.theme === "contrast3" ? "inherit" :
            settings.theme === "contrast4" ? "inherit" :
            readiumCSSDefaults.selectionTextColor,

        linkColor: (!settings.theme || settings.theme === "neutral") ? readiumCSSDefaults.linkColor :
            settings.theme === "sepia" ? readiumCSSDefaults.linkColor :
            settings.theme === "night" ? readiumCSSDefaults.linkColor :
            "#0000EE",
        linkVisitedColor: (!settings.theme || settings.theme === "neutral") ? readiumCSSDefaults.linkVisitedColor :
            settings.theme === "sepia" ? readiumCSSDefaults.linkVisitedColor :
            settings.theme === "night" ? readiumCSSDefaults.linkVisitedColor :
            "#551A8B", // never seems to work in ReadiumCSS

        textAlign: settings.align === textAlignEnum.left ? textAlignEnum.left :
            (settings.align === textAlignEnum.right ? textAlignEnum.right :
            (settings.align === textAlignEnum.justify ? textAlignEnum.justify :
            (settings.align === textAlignEnum.start ? textAlignEnum.start : undefined))),

        typeScale: readiumCSSDefaults.typeScale,

        wordSpacing: settings.wordSpacing,

        mathJax: settings.enableMathJax,

        reduceMotion: settings.reduceMotion,

        noFootnotes: settings.noFootnotes,

        noRuby: settings.noRuby,
    };

    const jsonMsg: IEventPayload_R2_EVENT_READIUMCSS = { setCSS: cssJson };
    return jsonMsg;
};
