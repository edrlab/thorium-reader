// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { connectRouter } from "connected-react-router";
import { History } from "history";
import { dialogReducer } from "readium-desktop/common/redux/reducers/dialog";
import { i18nReducer } from "readium-desktop/common/redux/reducers/i18n";
import { importReducer } from "readium-desktop/common/redux/reducers/import";
import { netReducer } from "readium-desktop/common/redux/reducers/net";
import { toastReducer } from "readium-desktop/common/redux/reducers/toast";
import { updateReducer } from "readium-desktop/common/redux/reducers/update";
import { apiReducer } from "readium-desktop/renderer/redux/reducers/api";
import { downloadReducer } from "readium-desktop/renderer/redux/reducers/download";
import { opdsReducer } from "readium-desktop/renderer/redux/reducers/opds";
import { readerReducer } from "readium-desktop/renderer/redux/reducers/reader";
import { winReducer } from "readium-desktop/renderer/redux/reducers/win";
import { RootState } from "readium-desktop/renderer/redux/states";
import { combineReducers } from "redux";

export const rootReducer = (history: History) => combineReducers<RootState>({
    i18n: i18nReducer,
    reader: readerReducer,
    opds: opdsReducer,
    win: winReducer,
    net: netReducer,
    update: updateReducer,
    api: apiReducer,
    dialog: dialogReducer,
    router: connectRouter(history),
    import: importReducer,
    toast: toastReducer,
    download: downloadReducer,
});
