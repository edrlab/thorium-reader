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
// import {
//     IReaderRootState, IReaderStateReader,
// } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { apiReducer } from "readium-desktop/renderer/common/redux/reducers/api";
import { winReducer } from "readium-desktop/renderer/common/redux/reducers/win";
import { mapReducer } from "readium-desktop/utils/redux-reducers/map.reducer";
import { combineReducers } from "redux";

// import { IHighlight } from "@r2-navigator-js/electron/common/highlight";

import { readerLocalActionHighlights } from "../actions";
import { IHighlightHandlerState, IHighlightMounterState } from "readium-desktop/common/redux/states/renderer/highlight";
import { readerInfoReducer } from "./info";
import { pickerReducer } from "./picker";
import { readerConfigReducer } from "./readerConfig";
import { readerLocatorReducer } from "./readerLocator";
import { searchReducer } from "./search";
import { IBookmarkState } from "readium-desktop/common/redux/states/bookmark";
import { priorityQueueReducer } from "readium-desktop/utils/redux-reducers/pqueue.reducer";
import { winModeReducer } from "readium-desktop/common/redux/reducers/winModeReducer";
import { readerDivinaReducer } from "./divina";
import { readerRTLFlipReducer } from "readium-desktop/common/redux/reducers/reader/rtlFlip";
import { sessionReducer } from "readium-desktop/common/redux/reducers/session";
import { readerDefaultConfigReducer } from "readium-desktop/common/redux/reducers/reader/defaultConfig";
import { themeReducer } from "readium-desktop/common/redux/reducers/theme";
import { IAnnotationState } from "readium-desktop/common/redux/states/renderer/annotation";
import { annotationModeEnableReducer } from "./annotationModeEnable";
import { readerActions } from "readium-desktop/common/redux/actions";
import { readerReadingFinishedReducer } from "readium-desktop/common/redux/reducers/readingFinished";

export const rootReducer = () => {

    return combineReducers({ // IReaderRootState
        theme: themeReducer,
        session: sessionReducer,
        api: apiReducer,
        i18n: i18nReducer,
        reader: combineReducers({ // IReaderStateReader, dehydrated from main process registry (preloaded state)
            defaultConfig: readerDefaultConfigReducer,
            config: readerConfigReducer,
            info: readerInfoReducer,
            locator: readerLocatorReducer,
            bookmark: priorityQueueReducer
                <
                    readerActions.bookmark.push.TAction,
                    readerActions.bookmark.pop.TAction,
                    number,
                    IBookmarkState,
                    string,
                    readerActions.bookmark.update.TAction
                >(
                    {
                        push: {
                            type: readerActions.bookmark.push.ID,
                            selector: (action) =>
                                [(new Date()).getTime(), action.payload],
                        },
                        pop: {
                            type: readerActions.bookmark.pop.ID,
                            selector: (action, queue) => queue.find(([_, bookmarkState]) => action.payload.uuid === bookmarkState.uuid),
                        },
                        sortFct: (a, b) => b[0] - a[0],
                        update: {
                            type: readerActions.bookmark.update.ID,
                            selector: (action, queue) =>
                                [
                                    queue.reduce<number>((pv, [k, v]) => v.uuid === action.payload.uuid ? k : pv, undefined),
                                    action.payload,
                                ],
                        },
                    },
                ),
            annotation: priorityQueueReducer
                <
                    readerActions.annotation.push.TAction,
                    readerActions.annotation.pop.TAction,
                    number,
                    IAnnotationState,
                    string,
                    readerActions.annotation.update.TAction
                >(
                    {
                        push: {
                            type: readerActions.annotation.push.ID,
                            selector: (action, _queue) => {
                                return [(new Date()).getTime(), action.payload];
                            },
                        },
                        pop: {
                            type: readerActions.annotation.pop.ID,
                            selector: (action, queue) => queue.find(([_, annotationState]) => action.payload.uuid === annotationState.uuid),
                        },
                        sortFct: (a, b) => b[0] - a[0],
                        update: {
                            type: readerActions.annotation.update.ID,
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
                                        (highlightHandlerState) => [highlightHandlerState.uuid, highlightHandlerState],
                                    ),
                            },
                            pop: {
                                type: readerLocalActionHighlights.handler.pop.ID,
                                selector: (action) =>
                                    action.payload?.map(
                                        (highlightBaseState) => [highlightBaseState.uuid, undefined],
                                    ),
                            },
                        },
                    ),
                mounter: mapReducer
                    <
                        readerLocalActionHighlights.mounter.mount.TAction,
                        readerLocalActionHighlights.mounter.unmount.TAction,
                        string,
                        IHighlightMounterState
                    >(
                        {
                            push: {
                                type: readerLocalActionHighlights.mounter.mount.ID,
                                selector: (action) =>
                                    action.payload?.map(
                                        (highlightMounterState) => [highlightMounterState.uuid, highlightMounterState],
                                    ),
                            },
                            pop: {
                                type: readerLocalActionHighlights.mounter.unmount.ID,
                                selector: (action) =>
                                    action.payload?.map(
                                        (highlightBaseState) => [highlightBaseState.uuid, undefined],
                                    ),
                            },
                        },
                    ),
            }),
            divina: readerDivinaReducer,
            disableRTLFlip: readerRTLFlipReducer,
            readingFinished: readerReadingFinishedReducer,
        }),
        search: searchReducer,
        annotation: annotationModeEnableReducer,
        picker: pickerReducer,
        win: winReducer,
        dialog: dialogReducer,
        toast: toastReducer,
        keyboard: keyboardReducer,
        mode: winModeReducer,
    });
};
