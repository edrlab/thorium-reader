// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer } from "redux";

import { readerActions } from "readium-desktop/common/redux/actions";
import { ReaderConfigByPublicationFormat } from "readium-desktop/common/readerConfig/resolveEffectiveReaderConfig";

function readerDefaultConfigByFormatReducer_(
    state: ReaderConfigByPublicationFormat = {},
    action: readerActions.configSetDefaultByFormat.TAction,
): ReaderConfigByPublicationFormat {

    const ac = action as readerActions.configSetDefaultByFormat.TAction;
    switch (action.type) {
        case readerActions.configSetDefaultByFormat.ID:
            return {
                ...state,
                [ac.payload.format]: {
                    ...(state[ac.payload.format] || {}),
                    ...ac.payload.config,
                },
            };

        default:
            return state;
    }
}

export const readerDefaultConfigByFormatReducer = readerDefaultConfigByFormatReducer_ as Reducer<ReaderConfigByPublicationFormat>;
