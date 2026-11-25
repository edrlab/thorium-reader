// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// see https://github.com/readium/ts-toolkit/pull/300/changes
// https://github.com/ardeshirj/shamsaink/blob/0090ec1fbf734320643786e36def484aca17b9ea/reader/lang.go#L39-L42
export function langStringIsRTL(lang: string): boolean {
    return lang === "ar" || lang.startsWith("ar-") ||
        lang === "fa" || lang.startsWith("fa-") ||
        lang === "per" || lang.startsWith("per-") ||
        lang === "fas" || lang.startsWith("fas-") ||
        lang === "he" || lang.startsWith("he-") ||
        lang === "iw" || lang.startsWith("iw-") ||
        lang === "yi" || lang.startsWith("yi-") ||
        lang === "ur" || lang.startsWith("ur-") ||
        lang === "ps" || lang.startsWith("ps-") ||
        lang === "sd" || lang.startsWith("sd-") ||
        lang === "ckb" || lang.startsWith("ckb-") ||
        lang === "ug" || lang.startsWith("ug-") ||
        lang === "dv" || lang.startsWith("dv-") ||
        lang === "syr" || lang.startsWith("syr-");

        // https://github.com/edrlab/thorium-reader/pull/3027
        // lang === "zh-Hant" || lang === "zh-TW"
}
