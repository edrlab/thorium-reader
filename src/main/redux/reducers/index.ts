// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { i18nReducer } from "readium-desktop/common/redux/reducers/i18n";
import { keyboardReducer } from "readium-desktop/common/redux/reducers/keyboard";
import { appReducer } from "readium-desktop/main/redux/reducers/app";
import { streamerReducer } from "readium-desktop/main/redux/reducers/streamer";
import { RootState } from "readium-desktop/main/redux/states";
import { priorityQueueReducer } from "readium-desktop/utils/redux-reducers/pqueue.reducer";
import { combineReducers } from "redux";

import { appActions, publicationActions, winActions } from "../actions";
import { lcpReducer } from "./lcp";
import { readerDefaultConfigReducer } from "./reader/defaultConfig";
import { sessionReducer } from "./session";
import { winRegistryReaderReducer } from "./win/registry/reader";
import { winSessionLibraryReducer } from "./win/session/library";
import { winSessionReaderReducer } from "./win/session/reader";
import { winModeReducer } from "../../../common/redux/reducers/winModeReducer";
import { publicationDbReducers } from "./publication/db";
import { opdsDbReducers } from "./opds/db";
import { _APP_VERSION } from "readium-desktop/preprocessor-directives";

export const rootReducer = combineReducers<RootState>({
    session: sessionReducer,
    streamer: streamerReducer,
    i18n: i18nReducer,
    reader: combineReducers({
        defaultConfig: readerDefaultConfigReducer,
    }),
    // net: netReducer,
    // update: updateReducer,
    app: appReducer,
    win: combineReducers({
        session: combineReducers({
            library: winSessionLibraryReducer,
            reader: winSessionReaderReducer,
        }),
        registry: combineReducers({
            reader: winRegistryReaderReducer,
        }),
    }),
    mode: winModeReducer,
    lcp: lcpReducer,
    publication: combineReducers({
        lastReadingQueue: priorityQueueReducer
            <
                winActions.session.setReduxState.TAction,
                publicationActions.deletePublication.TAction
            >(
                {
                    push: {
                        type: winActions.session.setReduxState.ID,
                        selector: (action) =>
                            [(new Date()).getTime(), action.payload.publicationIdentifier],
                    },
                    pop: {
                        type: publicationActions.deletePublication.ID,
                        selector: (action) => [undefined, action.payload.publicationIdentifier],
                    },
                    sortFct: (a, b) => b[0] - a[0],
                },
            ),
        db: publicationDbReducers,
    }),
    keyboard: keyboardReducer,
    opds: combineReducers({
        catalog: opdsDbReducers,
    }),
    version: (state, action) => action.type === appActions.initSuccess.ID ? _APP_VERSION : (state === undefined ? null : state),
});
