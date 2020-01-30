// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { dialogReducer } from "readium-desktop/common/redux/reducers/dialog";
import { i18nReducer } from "readium-desktop/common/redux/reducers/i18n";
import { toastReducer } from "readium-desktop/common/redux/reducers/toast";
import { apiReducer } from "readium-desktop/renderer/common/redux/reducers/api";
import { winReducer } from "readium-desktop/renderer/common/redux/reducers/win";
import {
    IReaderRootState, IReaderStateReader,
} from "readium-desktop/common/redux/states/renderer/readerRootState";
import { combineReducers } from "redux";

export const rootReducer = () => {
    return combineReducers<IReaderRootState>({
        api: apiReducer,
        i18n: i18nReducer,
        reader: combineReducers<IReaderStateReader>({
            config: readerConfigReducer,
            info: readerInfoReducer,
        }),
        win: winReducer,
        dialog: dialogReducer,
        toast: toastReducer,
    });
};
