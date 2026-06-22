// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export function langStringIsRTL(lang: string): boolean {
    return lang === "ar" || lang.startsWith("ar-") ||
        lang === "he" || lang.startsWith("he-") ||
        lang === "fa" || lang.startsWith("fa-");

        // https://github.com/edrlab/thorium-reader/pull/3027
        // lang === "zh-Hant" || lang === "zh-TW"
}
