// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { dialogReducer } from "readium-desktop/common/redux/reducers/dialog";
import { i18nReducer } from "readium-desktop/common/redux/reducers/i18n";
import { keyboardReducer } from "readium-desktop/common/redux/reducers/keyboard";
import { toastReducer } from "readium-desktop/common/redux/reducers/toast";
import {
    IReaderRootState, IReaderStateReader,
} from "readium-desktop/common/redux/states/renderer/readerRootState";
import { apiReducer } from "readium-desktop/renderer/common/redux/reducers/api";
import { winReducer } from "readium-desktop/renderer/common/redux/reducers/win";
import { combineReducers } from "redux";

import { readerInfoReducer } from "./info";
import { readerConfigReducer } from "./readerConfig";
import { readerLocatorReducer } from "./readerLocator";

export const rootReducer = () => {
    return combineReducers<IReaderRootState>({
        api: apiReducer,
        i18n: i18nReducer,
        reader: combineReducers<IReaderStateReader>({ // dehydrated from main process registry (preloaded state)
            config: readerConfigReducer,
            info: readerInfoReducer,
            locator: readerLocatorReducer,
        }),
        win: winReducer,
        dialog: dialogReducer,
        toast: toastReducer,
        keyboard: keyboardReducer,
    });
};
