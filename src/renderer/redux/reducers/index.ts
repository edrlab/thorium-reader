
import { combineReducers } from "redux";

import {
    windowReducer,
} from "readium-desktop/renderer/reducers/window";

import {
    messageReducer,
} from "readium-desktop/renderer/reducers/message";

import { i18nReducer } from "readium-desktop/common/redux/reducers/i18n";
import { lcpReducer } from "readium-desktop/common/redux/reducers/lcp";
import { winReducer } from "./win";

import { catalogReducer } from "readium-desktop/common/redux/reducers/catalog";
import { netReducer } from "readium-desktop/common/redux/reducers/net";
import { opdsReducer } from "readium-desktop/common/redux/reducers/opds";
import {
    publicationDownloadReducer,
} from "readium-desktop/common/redux/reducers/publication-download";
import { readerReducer } from "readium-desktop/common/redux/reducers/reader";
export const rootReducer = combineReducers({
    i18n: i18nReducer,
    catalog: catalogReducer,
    lcp: lcpReducer,
    window: windowReducer,
    reader: readerReducer,
    message: messageReducer,
    opds: opdsReducer,
    publicationDownloads: publicationDownloadReducer,
    win: winReducer,
    net: netReducer,
});
