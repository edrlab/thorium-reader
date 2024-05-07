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
import { sessionReducer } from "readium-desktop/common/redux/reducers/session";
import { priorityQueueReducer } from "readium-desktop/utils/redux-reducers/pqueue.reducer";
import { combineReducers } from "redux";

import { appActions, publicationActions, winActions } from "../actions";
import { publicationActions as publicationActionsFromCommonAction } from "readium-desktop/common/redux/actions";
import { lcpReducer } from "./lcp";
import { versionUpdateReducer } from "./version-update";
import { readerDefaultConfigReducer } from "../../../common/redux/reducers/reader/defaultConfig";
import { winRegistryReaderReducer } from "./win/registry/reader";
import { winSessionLibraryReducer } from "./win/session/library";
import { winSessionReaderReducer } from "./win/session/reader";
import { winModeReducer } from "../../../common/redux/reducers/winModeReducer";
import { readerRTLFlipReducer } from "../../../common/redux/reducers/reader/rtlFlip";
import { publicationDbReducers } from "./publication/db";
import { opdsDbReducers } from "./opds/db";
import { _APP_VERSION } from "readium-desktop/preprocessor-directives";
import { themeReducer } from "readium-desktop/common/redux/reducers/theme";
import { ActionWithSender } from "readium-desktop/common/models/sync";
import { wizardReducer } from "readium-desktop/common/redux/reducers/wizard";

export const rootReducer = combineReducers({ // RootState
    theme: themeReducer,
    session: sessionReducer,
    streamer: streamerReducer,
    i18n: i18nReducer,
    reader: combineReducers({
        defaultConfig: readerDefaultConfigReducer,
        disableRTLFlip: readerRTLFlipReducer,
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
    versionUpdate: versionUpdateReducer,
    publication: combineReducers({
        lastReadingQueue: priorityQueueReducer
            <
                winActions.session.setReduxState.TAction,
                publicationActions.deletePublication.TAction | publicationActionsFromCommonAction.readingFinished.TAction
            >(
                {
                    push: {
                        type: winActions.session.setReduxState.ID,
                        selector: (action) =>
                            [(new Date()).getTime(), action.payload.publicationIdentifier],
                    },
                    pop: {
                        type: [publicationActions.deletePublication.ID, publicationActionsFromCommonAction.readingFinished.ID],
                        selector: (action, queue) => queue.find(([_, publicationIdentifier]) => action.payload.publicationIdentifier === publicationIdentifier),
                        // selector: (action) => [undefined, action.payload.publicationIdentifier],
                    },
                    sortFct: (a, b) => b[0] - a[0],
                },
            ),
        readingFinishedQueue: priorityQueueReducer
            <
                publicationActionsFromCommonAction.readingFinished.TAction,
                publicationActions.deletePublication.TAction | winActions.session.setReduxState.TAction
            >(
                {
                    push: {
                        type: publicationActionsFromCommonAction.readingFinished.ID,
                        selector: (action) =>
                            [(new Date()).getTime(), action.payload.publicationIdentifier],
                    },
                    pop: {
                        type: [publicationActions.deletePublication.ID, winActions.session.setReduxState.ID],
                        selector: (action, queue) => queue.find(([_, publicationIdentifier]) => action.payload.publicationIdentifier === publicationIdentifier),
                        // selector: (action) => [undefined, action.payload.publicationIdentifier],
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
    version: (state: RootState, action: ActionWithSender) => action.type === appActions.initSuccess.ID ? _APP_VERSION : (state?.version ? state.version : null),
    wizard: wizardReducer,
});
