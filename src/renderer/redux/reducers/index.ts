
import { combineReducers } from "redux";

import { catalogReducer } from "readium-desktop/reducers/catalog";

import {
    windowReducer,
} from "readium-desktop/renderer/reducers/window";

import {
    readerReducer,
} from "readium-desktop/renderer/reducers/reader";

import {
    messageReducer,
} from "readium-desktop/renderer/reducers/message";

import { i18nReducer } from "readium-desktop/common/redux/reducers/i18n";

import { winReducer } from "./win";

import { netReducer } from "readium-desktop/common/redux/reducers/net";
import { opdsReducer } from "readium-desktop/common/redux/reducers/opds";
import {
    publicationDownloadReducer,
} from "readium-desktop/common/redux/reducers/publication-download";

export const rootReducer = combineReducers({
    i18n: i18nReducer,
    catalog: catalogReducer,
    window: windowReducer,
    reader: readerReducer,
    message: messageReducer,
    opds: opdsReducer,
    publicationDownloads: publicationDownloadReducer,
    win: winReducer,
    net: netReducer,
});
