
import { combineReducers } from "redux";

import { catalogReducer, CatalogState } from "readium-desktop/reducers/catalog";
import { i18n, I18NState } from "readium-desktop/reducers/i18n";

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
}

export const rootReducer = combineReducers({
    i18n,
    catalog: catalogReducer,
    window: windowReducer,
    reader: readerReducer,
    message: messageReducer,
});
