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

import { readerLocalActionAnnotations, readerLocalActionBookmarks, readerLocalActionHighlights } from "../actions";
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
import { annotationModeFocusReducer } from "./annotationModeFocus";
import { IAnnotationState } from "readium-desktop/common/redux/states/renderer/annotation";
import { annotationModeEnableReducer } from "./annotationModeEnable";

export const rootReducer = () => {
    return combineReducers({ // IReaderRootState
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
            annotation: priorityQueueReducer
                <
                    readerLocalActionAnnotations.push.TAction,
                    readerLocalActionAnnotations.pop.TAction,
                    number,
                    IAnnotationState,
                    string,
                    readerLocalActionAnnotations.update.TAction
                >(
                    {
                        push: {
                            type: readerLocalActionAnnotations.push.ID,
                            selector: (action) =>
                                [(new Date()).getTime(), action.payload],
                        },
                        pop: {
                            type: readerLocalActionAnnotations.pop.ID,
                            selector: (action) =>
                                [undefined, action.payload],
                        },
                        sortFct: (a, b) => b[0] - a[0],
                        update: {
                            type: readerLocalActionAnnotations.update.ID,
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
        }),
        search: searchReducer,
        annotationControlMode: combineReducers({
            mode: annotationModeEnableReducer,
            focus: annotationModeFocusReducer,
        }),
        picker: pickerReducer,
        win: winReducer,
        dialog: dialogReducer,
        toast: toastReducer,
        keyboard: keyboardReducer,
        mode: winModeReducer,
    });
};
