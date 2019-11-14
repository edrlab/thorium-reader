// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { i18nReducer } from "readium-desktop/common/redux/reducers/i18n";
import { netReducer } from "readium-desktop/common/redux/reducers/net";
import { updateReducer } from "readium-desktop/common/redux/reducers/update";
import { readerReducer } from "readium-desktop/main/redux/reducers/reader";
import { streamerReducer } from "readium-desktop/main/redux/reducers/streamer";
import { RootState } from "readium-desktop/main/redux/states";
import { combineReducers } from "redux";

export const rootReducer = combineReducers<RootState>({
    streamer: streamerReducer,
    i18n: i18nReducer,
    reader: readerReducer,
    net: netReducer,
    update: updateReducer,
    catalog: undefined, // CatalogState
    app: undefined, // AppState
});
