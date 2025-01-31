// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ICacheDocument } from "readium-desktop/common/redux/states/renderer/resourceCache";
import { type Reducer } from "redux";
import { readerLocalActionSetResourceToCache } from "../actions";

function readerResourceCacheReducer_(
    state: ICacheDocument[] = [],
    action: readerLocalActionSetResourceToCache.TAction,
): ICacheDocument[] {
    switch (action.type) {
        case readerLocalActionSetResourceToCache.ID:

            if (action.payload.searchDocument.length === 0) {
                return state;
            }
            const newState = state.slice();
            for (const doc of action.payload.searchDocument) {
                newState.push(doc);
            }
            return newState;
        default:
            return state;
    }
}
export const readerResourceCacheReducer = readerResourceCacheReducer_ as Reducer<ReturnType<typeof readerResourceCacheReducer_>>;
