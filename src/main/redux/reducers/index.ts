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
import { sessionReducer } from "readium-desktop/common/redux/reducers/session";
import { screenReaderReducer } from "readium-desktop/common/redux/reducers/screenReader";
import { priorityQueueReducer } from "readium-desktop/utils/redux-reducers/pqueue.reducer";
import { combineReducers } from "redux";

import { publicationActions } from "../actions";
import { customizationActions, publicationActions as publicationActionsFromCommonAction, readerActions } from "readium-desktop/common/redux/actions";
import { readerDefaultConfigReducer } from "../../../common/redux/reducers/reader/defaultConfig";
// import { winRegistryReaderReducer } from "./win/registry/reader";
import { winSessionLibraryReducer } from "./win/session/library";
import { winSessionReaderReducer } from "./win/session/reader";
import { winModeReducer } from "../../../common/redux/reducers/winModeReducer";
import { readerRTLFlipReducer } from "../../../common/redux/reducers/reader/rtlFlip";
import { publicationDbReducers } from "./publication/db";
import { opdsDbReducers } from "./opds/db";
import { _APP_VERSION } from "readium-desktop/preprocessor-directives";
import { themeReducer } from "readium-desktop/common/redux/reducers/theme";
import { versionUpdateReducer } from "readium-desktop/common/redux/reducers/version-update";
import { wizardReducer } from "readium-desktop/common/redux/reducers/wizard";
import { versionReducer } from "readium-desktop/common/redux/reducers/version";
import { creatorReducer } from "readium-desktop/common/redux/reducers/creator";
import { settingsReducer } from "readium-desktop/common/redux/reducers/settings";
import { lcpReducer } from "readium-desktop/common/redux/reducers/lcp";
import { noteExportReducer } from "readium-desktop/common/redux/reducers/noteExport";
import { customizationPackageActivatingReducer } from "readium-desktop/common/redux/reducers/customization/activate";
import { customizationPackageProvisioningReducer } from "readium-desktop/common/redux/reducers/customization/provision";
import { customizationPackageActivatingLockReducer } from "readium-desktop/common/redux/reducers/customization/lock";
import { arrayReducer } from "readium-desktop/utils/redux-reducers/array.reducer";
import { ICustomizationProfileHistory } from "readium-desktop/common/redux/states/customization";
import { customizationPackageWelcomeScreenReducer } from "readium-desktop/common/redux/reducers/customization/welcomeScreen";
import { ICustomizationManifest } from "readium-desktop/common/readium/customization/manifest";
import { EventPayload } from "readium-desktop/common/ipc/sync";
import { SenderType } from "readium-desktop/common/models/sync";
import debug_ from "debug";

const filename_ = "readium-desktop:main:redux:reducers:index";
const debug = debug_(filename_);
debug("_");

export const rootReducer = combineReducers({ // RootState
    versionUpdate: versionUpdateReducer,
    theme: themeReducer,
    session: sessionReducer,
    screenReader: screenReaderReducer,
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
            reader: (state: any = null) => state, // winRegistryReaderReducer,
        }),
    }),
    mode: winModeReducer,
    lcp: lcpReducer,
    publication: combineReducers({
        lastReadingQueue: priorityQueueReducer
            <
                readerActions.setLocator.TAction,
                publicationActions.deletePublication.TAction | publicationActionsFromCommonAction.readingFinished.TAction
            >(
                {
                    push: {
                        type: readerActions.setLocator.ID,
                        selector: (action) => {
                            debug("lastReadingQueue push", action);
                            let pubId = "";
                            if (action.type ==="READER_SET_LOCATOR") {
                                // const locatorJsonObj = action.payload as unknown as object;
                                const sender = action.sender as EventPayload["sender"];
                                if (sender?.type !== SenderType.Renderer) {
                                    debug("sender is not renderer !!!");
                                    return [undefined, undefined];
                                }
                                pubId = sender?.reader_pubId; // see syncFactory
                                debug("lastReadingQueue SET LOCATOR", pubId);
                            } else {
                                debug("error not setLocator action !!");
                            }

                            return [(new Date()).getTime(), pubId];
                        },
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
                publicationActions.deletePublication.TAction | readerActions.setLocator.TAction
            >(
                {
                    push: {
                        type: publicationActionsFromCommonAction.readingFinished.ID,
                        selector: (action) =>
                            [(new Date()).getTime(), action.payload.publicationIdentifier],
                    },
                    pop: {
                        type: [publicationActions.deletePublication.ID, readerActions.setLocator.ID],
                        selector: (action, queue) => {
                            debug("readingFinishedQueue pop", action);
                            let pubId = "";
                            if (action.type === "READER_SET_LOCATOR") {
                                // const locatorJsonObj = action.payload as unknown as object;
                                const sender = action.sender as EventPayload["sender"];
                                if (sender?.type !== SenderType.Renderer) {
                                    debug("sender is not renderer !!!");
                                    return [undefined, undefined];
                                }
                                pubId = sender?.reader_pubId; // see syncFactory
                                debug("readingFinishedQueue SET LOCATOR  ", pubId);
                            } else {
                                pubId = action.payload.publicationIdentifier;
                            }
                            
                            return queue.find(([_, publicationIdentifier]) => pubId === publicationIdentifier);
                        },
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
    version: versionReducer,
    wizard: wizardReducer,
    settings: settingsReducer,
    creator: creatorReducer,
    noteExport: noteExportReducer,
    customization: combineReducers({
        history: arrayReducer<customizationActions.addHistory.TAction, undefined, ICustomizationProfileHistory, Pick<ICustomizationProfileHistory, "id">>(
                {
                    add: {
                        type: customizationActions.addHistory.ID,
                        selector: (payload, _state) => {
                            const { id, version } = payload;
                            return [{id, version}];
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
        manifest: () => null as ICustomizationManifest,
    }),
});
