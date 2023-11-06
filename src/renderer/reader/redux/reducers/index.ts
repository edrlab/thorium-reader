// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { dialogReducer } from "readium-desktop/common/redux/reducers/dialog";
import { i18nReducer } from "readium-desktop/common/redux/reducers/i18n";
import { keyboardReducer } from "readium-desktop/common/redux/reducers/keyboard";
import { toastReducer } from "readium-desktop/common/redux/reducers/toast";
import {
    IReaderRootState, IReaderStateReader,
} from "readium-desktop/common/redux/states/renderer/readerRootState";
import { apiReducer } from "readium-desktop/renderer/common/redux/reducers/api";
import { winReducer } from "readium-desktop/renderer/common/redux/reducers/win";
import { mapReducer } from "readium-desktop/utils/redux-reducers/map.reducer";
import { combineReducers } from "redux";

import { IHighlight } from "@r2-navigator-js/electron/common/highlight";

import { readerLocalActionBookmarks, readerLocalActionHighlights } from "../actions";
import { IHighlightHandlerState } from "readium-desktop/common/redux/states/renderer/highlight";
import { readerInfoReducer } from "./info";
import { pickerReducer } from "./picker";
import { readerConfigReducer } from "./readerConfig";
import { readerLocatorReducer } from "./readerLocator";
import { searchReducer } from "./search";
import { IBookmarkState } from "readium-desktop/common/redux/states/bookmark";
import { priorityQueueReducer } from "readium-desktop/utils/redux-reducers/pqueue.reducer";
import { winModeReducer } from "readium-desktop/common/redux/reducers/winModeReducer";
import { readerDivinaReducer } from "./divina";
import { sessionReducer } from "readium-desktop/common/redux/reducers/session";

export const rootReducer = () => {
    return combineReducers<IReaderRootState>({
        session: sessionReducer,
        api: apiReducer,
        i18n: i18nReducer,
        reader: combineReducers<IReaderStateReader>({ // dehydrated from main process registry (preloaded state)
            config: readerConfigReducer,
            info: readerInfoReducer,
            locator: readerLocatorReducer,
            bookmark: priorityQueueReducer
                    <
                        readerLocalActionBookmarks.push.TAction,
                        readerLocalActionBookmarks.pop.TAction,
                        number,
                        IBookmarkState,
                        string,
                        readerLocalActionBookmarks.update.TAction
                    >(
                        {
                            push: {
                                type: readerLocalActionBookmarks.push.ID,
                                selector: (action) =>
                                    [(new Date()).getTime(), action.payload],
                            },
                            pop: {
                                type: readerLocalActionBookmarks.pop.ID,
                                selector: (action) =>
                                    [undefined, action.payload],
                            },
                            sortFct: (a, b) => b[0] - a[0],
                            update: {
                                type: readerLocalActionBookmarks.update.ID,
                                selector: (action, queue) =>
                                    [
                                        queue.reduce<number>((pv, [k, v]) => v.uuid === action.payload.uuid ? k : pv, undefined),
                                        action.payload,
                                    ],
                            },
                        },
                    ),
            highlight: combineReducers({
                handler: mapReducer
                    <
                        readerLocalActionHighlights.handler.push.TAction,
                        readerLocalActionHighlights.handler.pop.TAction,
                        string,
                        IHighlightHandlerState
                    >(
                        {
                            push: {
                                type: readerLocalActionHighlights.handler.push.ID,
                                selector: (action) =>
                                    action.payload?.map(
                                        (v) => [v.uuid, v],
                                    ),
                            },
                            pop: {
                                type: readerLocalActionHighlights.handler.pop.ID,
                                selector: (action) =>
                                    action.payload?.map(
                                        (v) => [v.uuid, undefined],
                                    ),
                            },
                        },
                    ),
                mounter: mapReducer
                    <
                        readerLocalActionHighlights.mounter.mount.TAction,
                        readerLocalActionHighlights.mounter.unmount.TAction,
                        string,
                        IHighlight
                    >(
                        {
                            push: {
                                type: readerLocalActionHighlights.mounter.mount.ID,
                                selector: (action) =>
                                    action.payload?.map(
                                        (v) => [v.uuid, v.ref],
                                    ),
                            },
                            pop: {
                                type: readerLocalActionHighlights.mounter.unmount.ID,
                                selector: (action) =>
                                    action.payload?.map(
                                        (v) => [v.uuid, undefined],
                                    ),
                            },
                        },
                    ),
            }),
            divina: readerDivinaReducer,
        }),
        search: searchReducer,
        picker: pickerReducer,
        win: winReducer,
        dialog: dialogReducer,
        toast: toastReducer,
        keyboard: keyboardReducer,
        mode: winModeReducer,
    });
};
