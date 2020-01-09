// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { dialogReducer } from "readium-desktop/common/redux/reducers/dialog";
import { i18nReducer } from "readium-desktop/common/redux/reducers/i18n";
import { apiReducer } from "readium-desktop/renderer/library/redux/reducers/api";
import { winReducer } from "readium-desktop/renderer/library/redux/reducers/win";
import { readerReducer } from "readium-desktop/renderer/reader/redux/reducers/reader";
import { combineReducers } from "redux";

export const rootReducer = () =>
    combineReducers({
        api: apiReducer,
        i18n: i18nReducer,
        reader: readerReducer,
        win: winReducer,
        dialog: dialogReducer,
    });

export type TRootState = ReturnType<ReturnType<typeof rootReducer>>;
