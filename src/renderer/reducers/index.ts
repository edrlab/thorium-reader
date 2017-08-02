
import { combineReducers } from "redux";

import { catalogReducer, CatalogState } from "readium-desktop/reducers/catalog";
import { opdsReducer, OpdsState } from "readium-desktop/reducers/opds";

import {
    windowReducer,
    WindowState,
} from "readium-desktop/renderer/reducers/window";

import {
    readerReducer,
    ReaderState,
} from "readium-desktop/renderer/reducers/reader";

import {
    messageReducer,
    MessageState,
} from "readium-desktop/renderer/reducers/message";

export interface RendererState {
    i18n: I18NState;
    catalog: CatalogState;
    window: WindowState;
    reader: ReaderState;
    message: MessageState;
    opds: OpdsState;
}

export const rootReducer = combineReducers({
    i18n,
    catalog: catalogReducer,
    window: windowReducer,
    reader: readerReducer,
    message: messageReducer,
    opds: opdsReducer,
});
