
import { combineReducers } from "redux";

import { catalogReducer } from "readium-desktop/reducers/catalog";
import { opdsReducer } from "readium-desktop/reducers/opds";

import {
    windowReducer,
} from "readium-desktop/renderer/reducers/window";

import {
    readerReducer,
} from "readium-desktop/renderer/reducers/reader";

import {
    messageReducer,
} from "readium-desktop/renderer/reducers/message";

import { i18n } from "readium-desktop/reducers/i18n";

import { winReducer } from "./win";

import { netReducer } from "readium-desktop/common/redux/reducers/net";

export const rootReducer = combineReducers({
    i18n,
    catalog: catalogReducer,
    window: windowReducer,
    reader: readerReducer,
    message: messageReducer,
    opds: opdsReducer,
    win: winReducer,
    net: netReducer,
});
