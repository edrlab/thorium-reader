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
import { readerConfigReducer } from "./readerConfig";
import { readerLocatorReducer } from "./readerLocator";
import { searchReducer } from "./search";
// import { IBookmarkState } from "readium-desktop/common/redux/states/bookmark";
// import { priorityQueueReducer } from "readium-desktop/utils/redux-reducers/pqueue.reducer";
import { winModeReducer } from "readium-desktop/common/redux/reducers/winModeReducer";
import { readerDivinaReducer } from "./divina";
import { readerRTLFlipReducer } from "readium-desktop/common/redux/reducers/reader/rtlFlip";
import { sessionReducer } from "readium-desktop/common/redux/reducers/session";
import { readerDefaultConfigReducer } from "readium-desktop/common/redux/reducers/reader/defaultConfig";
import { themeReducer } from "readium-desktop/common/redux/reducers/theme";
import { versionUpdateReducer } from "readium-desktop/common/redux/reducers/version-update";
import { annotationModeEnableReducer } from "./annotationModeEnable";
import { customizationActions, readerActions } from "readium-desktop/common/redux/actions";
import { readerMediaOverlayReducer } from "./mediaOverlay";
import { readerTTSReducer } from "./tts";
import { readerTransientConfigReducer } from "./readerTransientConfig";
import { readerAllowCustomConfigReducer } from "readium-desktop/common/redux/reducers/reader/allowCustom";
import { creatorReducer } from "readium-desktop/common/redux/reducers/creator";
import { importAnnotationReducer } from "readium-desktop/renderer/common/redux/reducers/importAnnotation";
import { tagReducer } from "readium-desktop/common/redux/reducers/tag";
import { readerLockReducer } from "./lock";
import { imageClickReducer } from "./imageClick";
import { dockReducer } from "readium-desktop/common/redux/reducers/dock";
import { readerBookmarkTotalCountReducer } from "readium-desktop/common/redux/reducers/reader/bookmarkTotalCount";
import { lcpReducer } from "readium-desktop/common/redux/reducers/lcp";
import { arrayReducer } from "readium-desktop/utils/redux-reducers/array.reducer";
import { INoteState } from "readium-desktop/common/redux/states/renderer/note";
import { noteExportReducer } from "readium-desktop/common/redux/reducers/noteExport";
import { customizationPackageProvisioningReducer } from "readium-desktop/common/redux/reducers/customization/provision";
import { customizationPackageActivatingReducer } from "readium-desktop/common/redux/reducers/customization/activate";
import { customizationPackageActivatingLockReducer } from "readium-desktop/common/redux/reducers/customization/lock";
import { ICustomizationProfileHistory } from "readium-desktop/common/redux/states/customization";
import { customizationPackageWelcomeScreenReducer } from "readium-desktop/common/redux/reducers/customization/welcomeScreen";

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
            noteTotalCount: readerBookmarkTotalCountReducer,
            transientConfig: readerTransientConfigReducer,// ReaderConfigPublisher
            info: readerInfoReducer,
            locator: readerLocatorReducer,
            note: arrayReducer<readerActions.note.addUpdate.TAction, readerActions.note.remove.TAction, INoteState, Pick<INoteState, "uuid">>(
                {
                    add: {
                        type: readerActions.note.addUpdate.ID,
                        selector: (payload, state) => {
                            const { previousNote, newNote } = payload;
                            if (!previousNote) {
                                return [newNote];
                            }
                            if (previousNote.uuid === newNote.uuid && state.find((item) => item.uuid === previousNote.uuid)) {
                                return [newNote];
                            }
                            console.error("NoteArrayReducer error : trying to update a note already deleted !!", JSON.stringify(previousNote, null, 2), JSON.stringify(newNote, null, 2));
                            return [];
                        },
                    },
                    remove: {
                        type: readerActions.note.remove.ID,
                        selector: (payload) => {
                            return [payload.note];
                        },
                    },
                    getId: (item) => item.uuid,
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
                                        (highlightBaseState) => [highlightBaseState.uuid, undefined as IHighlightHandlerState | undefined],
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
                                        (highlightBaseState) => [highlightBaseState.uuid, undefined as IHighlightMounterState | undefined],
                                    ),
                            },
                        },
                    ),
            }),
            divina: readerDivinaReducer,
            disableRTLFlip: readerRTLFlipReducer,
            mediaOverlay: readerMediaOverlayReducer,
            tts: readerTTSReducer,
            lock: readerLockReducer,
        }),
        search: searchReducer,
        annotation: annotationModeEnableReducer,
        noteTagsIndex: arrayReducer<readerActions.note.addUpdate.TAction | readerActions.note.remove.TAction, undefined, { tag: string, index: number }, { tag: string }>(
            {
                add: [
                    {
                        type: readerActions.note.addUpdate.ID,
                        selector: (payload, state) => {
                            const oldTags = (payload as readerActions.note.addUpdate.IPayload).previousNote?.tags;
                            const newTags = (payload as readerActions.note.addUpdate.IPayload).newNote.tags;

                            if (oldTags && newTags && oldTags[0] === newTags[0]) {
                                return undefined;
                            }

                            const items = [];
                            if (oldTags && oldTags[0]) {
                                const found = state.find(({ tag }) => tag === oldTags[0]);
                                items.push({tag: oldTags[0], index: Math.max((found?.index || 0) - 1, 0)});
                            }

                            if (newTags && newTags[0]) {
                                const found = state.find(({ tag }) => tag === newTags[0]);
                                items.push({ tag: newTags[0], index: (found?.index || 0) + 1 });
                            }

                            return items;
                        },
                    },
                    {
                        type: readerActions.note.remove.ID,
                        selector: (payload, state) => {
                            const tags = (payload as readerActions.note.remove.IPayload).note.tags;
                            if (tags && tags[0]) {
                                return [{tag: tags[0], index: Math.max((state.find(({ tag }) => tag === tags[0])?.index || 0) - 1, 0)}];
                            }
                            return undefined;
                        },
                    },
                ],
                remove: undefined,
                getId: (item) => item.tag,
            },
        ),
        win: winReducer,
        dialog: dialogReducer,
        dock: dockReducer,
        toast: toastReducer,
        keyboard: keyboardReducer,
        mode: winModeReducer,
        creator: creatorReducer,
        importAnnotations: importAnnotationReducer,
        publication: combineReducers({
            tag: tagReducer,
        }),
        img: imageClickReducer,
        lcp: lcpReducer,
        noteExport: noteExportReducer,
        customization: combineReducers({
            history: arrayReducer<customizationActions.addHistory.TAction, undefined, ICustomizationProfileHistory, Pick<ICustomizationProfileHistory, "id">>(
                {
                    add: {
                        type: customizationActions.addHistory.ID,
                        selector: (payload, _state) => {
                            const { id, version } = payload;
                            return [{ id, version }];
                        },
                    },
                    remove: undefined,
                    getId: (item) => item.id,
                },
            ),
            activate: customizationPackageActivatingReducer,
            provision: customizationPackageProvisioningReducer,
            lock: customizationPackageActivatingLockReducer,
            welcomeScreen: customizationPackageWelcomeScreenReducer,
        }),
    });
};
