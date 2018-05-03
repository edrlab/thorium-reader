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
} from "readium-desktop/common/redux/reducers/reader";

import {
    catalogReducer,
} from "readium-desktop/common/redux/reducers/catalog";
import {
    downloaderReducer,
} from "readium-desktop/common/redux/reducers/downloader";
import { lcpReducer } from "readium-desktop/common/redux/reducers/lcp";
import { netReducer } from "readium-desktop/common/redux/reducers/net";
import { opdsReducer } from "readium-desktop/common/redux/reducers/opds";
import { updateReducer } from "readium-desktop/common/redux/reducers/update";

import {
    publicationDownloadReducer,
} from "readium-desktop/common/redux/reducers/publication-download";

export const rootReducer = combineReducers({
    donwloader: downloaderReducer,
    streamer: streamerReducer,
    catalog: catalogReducer,
    i18n: i18nReducer,
    lcp: lcpReducer,
    publicationDownloads: publicationDownloadReducer,
    reader: readerReducer,
    net: netReducer,
    opds: opdsReducer,
    update: updateReducer,
});
