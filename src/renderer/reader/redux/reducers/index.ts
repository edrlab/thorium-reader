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
import { versionUpdateReducer } from "readium-desktop/common/redux/reducers/version-update";
import { IAnnotationState } from "readium-desktop/common/redux/states/renderer/annotation";
import { annotationModeEnableReducer } from "./annotationModeEnable";
import { readerActions } from "readium-desktop/common/redux/actions";
import { readerMediaOverlayReducer } from "./mediaOverlay";
import { readerTTSReducer } from "./tts";
import { readerTransientConfigReducer } from "./readerTransientConfig";
import { readerAllowCustomConfigReducer } from "readium-desktop/common/redux/reducers/reader/allowCustom";
import { annotationTagsIndexReducer } from "./annotationTagsIndex";
import { creatorReducer } from "readium-desktop/common/redux/reducers/creator";
import { importAnnotationReducer } from "readium-desktop/renderer/common/redux/reducers/importAnnotation";
import { tagReducer } from "readium-desktop/common/redux/reducers/tag";

export const rootReducer = () => {

    return combineReducers({ // IReaderRootState
        versionUpdate: versionUpdateReducer,
        theme: themeReducer,
        session: sessionReducer,
        api: apiReducer,
        i18n: i18nReducer,
        reader: combineReducers({ // IReaderStateReader, dehydrated from main process registry (preloaded state)
            defaultConfig: readerDefaultConfigReducer,
            config: readerConfigReducer,
            allowCustomConfig: readerAllowCustomConfigReducer,
            transientConfig: readerTransientConfigReducer,// ReaderConfigPublisher
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
                            selector: (action, queue) => {
                                const [_, newAnnot] = action.payload;
                                return [
                                    queue.reduce<number>((pv, [k, v]) => v.uuid === newAnnot.uuid ? k : pv, undefined),
                                    newAnnot,
                                ];
                            },
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
            mediaOverlay: readerMediaOverlayReducer,
            tts: readerTTSReducer,
        }),
        search: searchReducer,
        annotation: annotationModeEnableReducer,
        annotationTagsIndex: annotationTagsIndexReducer,
        picker: pickerReducer,
        win: winReducer,
        dialog: dialogReducer,
        toast: toastReducer,
        keyboard: keyboardReducer,
        mode: winModeReducer,
        creator: creatorReducer,
        importAnnotations: importAnnotationReducer,
        publication: combineReducers({
            tag: tagReducer,
        }),
    });
};
