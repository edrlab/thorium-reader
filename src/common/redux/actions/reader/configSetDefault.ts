// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ReaderConfig } from "readium-desktop/common/models/reader";
import { Action } from "readium-desktop/common/models/redux";
import { readerConfigInitialState } from "../../states/reader";
import { isNotNil } from "readium-desktop/utils/nil";

export const ID = "READER_DEFAULT_CONFIG_SET_REQUEST";

export interface Payload {
    config: ReaderConfig;
}

export function build(config: ReaderConfig = readerConfigInitialState):
    Action<typeof ID, Payload> {

    const configCopy = {
        ...config,
    };


    // see src/common/redux/states/reader.ts
    // see src/common/models/reader.ts
    if (isNotNil(configCopy["ttsVoices"])) {
        configCopy["ttsVoices"] = [];
    }
    if (isNotNil(configCopy["annotation_defaultColor"])) {
        configCopy["annotation_defaultColor"] = { ...configCopy["annotation_defaultColor"] };
    }
    if (isNotNil(configCopy["ttsHighlightColor"])) {
        configCopy["ttsHighlightColor"] = { ...configCopy["ttsHighlightColor"] };
    }
    if (isNotNil(configCopy["ttsHighlightColor_WORD"])) {
        configCopy["ttsHighlightColor_WORD"] = { ...configCopy["ttsHighlightColor_WORD"] };
    }
    delete configCopy.readerSettingsSection;
    delete configCopy.readerMenuSection;

    return {
        type: ID,
        payload: {
            config: configCopy,
        },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
// export type TActionStr = Action<string, Payload>;
