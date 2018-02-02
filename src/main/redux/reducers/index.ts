import { combineReducers } from "redux";

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
import { netReducer } from "readium-desktop/common/redux/reducers/net";
import { opdsReducer } from "readium-desktop/common/redux/reducers/opds";
import {
    publicationDownloadReducer,
} from "readium-desktop/common/redux/reducers/publication-download";

export const rootReducer = combineReducers({
    donwloader: downloaderReducer,
    streamer: streamerReducer,
    catalog: catalogReducer,
    publicationDownloads: publicationDownloadReducer,
    reader: readerReducer,
    net: netReducer,
    opds: opdsReducer,
});
