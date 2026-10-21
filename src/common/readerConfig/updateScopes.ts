// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ReaderConfig } from "readium-desktop/common/models/reader";

const GLOBAL_ONLY_KEYS = new Set<keyof ReaderConfig>([
    "theme",
]);

const LOCAL_ONLY_KEYS = new Set<keyof ReaderConfig>([
    "lang",
    "readingDirection",
    "readerSettingsSection",
    "readerMenuSection",
    "ttsVoices",
]);

export interface IReaderConfigScopeUpdates {
    globalUpdate: Partial<ReaderConfig>;
    localUpdate: Partial<ReaderConfig>;
}

export function splitReaderConfigUpdateByScope(update: Partial<ReaderConfig>): IReaderConfigScopeUpdates {
    const globalUpdate: Partial<ReaderConfig> = {};
    const localUpdate: Partial<ReaderConfig> = {};

    for (const key of Object.keys(update) as Array<keyof ReaderConfig>) {
        const value = update[key];

        if (LOCAL_ONLY_KEYS.has(key)) {
            localUpdate[key] = value;
            continue;
        }

        if (GLOBAL_ONLY_KEYS.has(key)) {
            globalUpdate[key] = value;
            continue;
        }

        // Dual-scope default: keep local publication state and update global-by-format.
        localUpdate[key] = value;
        globalUpdate[key] = value;
    }

    return {
        globalUpdate,
        localUpdate,
    };
}
