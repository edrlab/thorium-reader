// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Translator } from "readium-desktop/common/services/translator";
import { IStringMap } from "@r2-shared-js/models/metadata-multilang";
import { BCP47_UNKNOWN_LANG } from "@r2-shared-js/parser/epub";

// MAIN process only, not RENDERER, because of diMainGet("translator")
// import { convertMultiLangStringToString } from "readium-desktop/main/converter/tools/localisation";
export function convertMultiLangStringToString(translator: Translator, items: string | IStringMap | undefined): [lang: string, str: string] {
    if (typeof items === "object") {
        // see translator.translateContentField() ?
        const langs = Object.keys(items);
        const lang = langs.filter((l) =>
            l.toLowerCase().includes(translator.getLocale().toLowerCase()));
        const localeLang = lang[0];

        if (items[localeLang]) {
            return [localeLang, items[localeLang]];
        }
        if (items._) {
            return [BCP47_UNKNOWN_LANG, items._];
        }
        if (items[BCP47_UNKNOWN_LANG]) {
            return [BCP47_UNKNOWN_LANG, items[BCP47_UNKNOWN_LANG]];
        }
        return [langs[0], items[langs[0]]];
    }
    return [BCP47_UNKNOWN_LANG, items];
}

export function langStringIsRTL(lang: string): boolean {
    return lang === "ar" || lang.startsWith("ar-") ||
        lang === "he" || lang.startsWith("he-") ||
        lang === "fa" || lang.startsWith("fa-") ||
        lang === "zh-Hant" ||
        lang === "zh-TW";
}
