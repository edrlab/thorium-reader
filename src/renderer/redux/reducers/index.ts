// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { combineReducers } from "redux";

import {
    windowReducer,
} from "readium-desktop/renderer/reducers/window";

import {
    messageReducer,
} from "readium-desktop/renderer/reducers/message";

import { i18nReducer } from "readium-desktop/common/redux/reducers/i18n";

import { connectRouter } from "connected-react-router";

import { dialogReducer } from "readium-desktop/common/redux/reducers/dialog";
import { netReducer } from "readium-desktop/common/redux/reducers/net";
import { updateReducer } from "readium-desktop/common/redux/reducers/update";

import { readerReducer } from "readium-desktop/common/redux/reducers/reader";

import { winReducer } from "./win";

import { apiReducer } from "./api";

import { opdsReducer } from "./opds";

import { History } from "history";

export const rootReducer = (history: History) => combineReducers({
    i18n: i18nReducer,
    window: windowReducer,
    reader: readerReducer,
    message: messageReducer,
    opds: opdsReducer,
    win: winReducer,
    net: netReducer,
    update: updateReducer,
    api: apiReducer,
    dialog: dialogReducer,
    router: connectRouter(history),
});
