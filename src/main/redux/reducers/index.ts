// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { combineReducers } from "redux";

import {
    i18nReducer,
} from "readium-desktop/common/redux/reducers/i18n";

import {
    streamerReducer,
} from "readium-desktop/main/redux/reducers/streamer";

import {
    readerReducer,
} from "./reader";

import { netReducer } from "readium-desktop/common/redux/reducers/net";
import { updateReducer } from "readium-desktop/common/redux/reducers/update";

export const rootReducer = combineReducers({
    streamer: streamerReducer,
    i18n: i18nReducer,
    reader: readerReducer,
    net: netReducer,
    update: updateReducer,
});
