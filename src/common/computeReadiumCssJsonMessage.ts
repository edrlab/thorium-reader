// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ReaderConfig } from "readium-desktop/common/models/reader";
import { _NODE_MODULE_RELATIVE_URL, _PACKAGING } from "readium-desktop/preprocessor-directives";

import { IEventPayload_R2_EVENT_READIUMCSS } from "@r2-navigator-js/electron/common/events";
import {
    colCountEnum, IReadiumCSS, readiumCSSDefaults, textAlignEnum,
} from "@r2-navigator-js/electron/common/readium-css-settings";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";
import { Link } from "@r2-shared-js/models/publication-link";

export function computeReadiumCssJsonMessage(settings: ReaderConfig) {
    return (_r2Publication?: R2Publication, _link?: Link | undefined):
        IEventPayload_R2_EVENT_READIUMCSS => {

        // TODO: see the readiumCSSDefaults values below, replace with readium-desktop's own
        const cssJson: IReadiumCSS = {

            a11yNormalize: readiumCSSDefaults.a11yNormalize,

            backgroundColor: readiumCSSDefaults.backgroundColor,

            bodyHyphens: readiumCSSDefaults.bodyHyphens,

            colCount: settings.colCount === "1" ? colCountEnum.one :
                (settings.colCount === "2" ? colCountEnum.two : colCountEnum.auto),

            darken: settings.dark,

            font: settings.font,

            fontSize: settings.fontSize,

            invert: settings.invert,

            letterSpacing: settings.letterSpacing,

            ligatures: readiumCSSDefaults.ligatures,

            lineHeight: settings.lineHeight,

            night: settings.night,

            pageMargins: settings.pageMargins,

            paged: settings.paged,

            paraIndent: readiumCSSDefaults.paraIndent,

            paraSpacing: settings.paraSpacing,

            sepia: settings.sepia,

            noFootnotes: settings.noFootnotes,

            textAlign: settings.align === textAlignEnum.left ? textAlignEnum.left :
                (settings.align === textAlignEnum.right ? textAlignEnum.right :
                    (settings.align === textAlignEnum.justify ? textAlignEnum.justify :
                        (settings.align === textAlignEnum.start ? textAlignEnum.start : undefined))),

            textColor: readiumCSSDefaults.textColor,

            typeScale: readiumCSSDefaults.typeScale,

            wordSpacing: settings.wordSpacing,

            mathJax: settings.enableMathJax,

            reduceMotion: readiumCSSDefaults.reduceMotion,
        };

        const jsonMsg: IEventPayload_R2_EVENT_READIUMCSS = {
            setCSS: cssJson,
        };
        return jsonMsg;
    };
}
