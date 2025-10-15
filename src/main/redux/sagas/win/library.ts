// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { winIpc } from "readium-desktop/common/ipc";
import { takeSpawnEveryChannel } from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { takeSpawnLeading } from "readium-desktop/common/redux/sagas/takeSpawnLeading";
import {
    closeProcessLock, getLibraryWindowFromDi, getReaderWindowFromDi,
} from "readium-desktop/main/di";
import { error } from "readium-desktop/main/tools/error";
import { winActions } from "readium-desktop/main/redux/actions";
import { RootState } from "readium-desktop/main/redux/states";
import { ObjectKeys, ObjectValues } from "readium-desktop/utils/object-keys-values";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { all, call, delay, put, spawn, take } from "redux-saga/effects";
import { call as callTyped, select as selectTyped } from "typed-redux-saga/macro";

import { IWinSessionReaderState } from "../../states/win/session/reader";
import { getAppActivateEventChannel } from "../getEventChannel";
import { createLibraryWindow } from "./browserWindow/createLibraryWindow";
import { checkReaderWindowInSession } from "./session/checkReaderWindowInSession";
import { getCatalog } from "../catalog";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";

// Logger
const filename_ = "readium-desktop:main:redux:sagas:win:library";
const debug = debug_(filename_);
debug("_");

// On OS X it's common to re-create a window in the app when the dock icon is clicked and there are no other
// windows open.
export function* appActivate() {

    if (closeProcessLock.isLock) {

        error(filename_ + "appActivate", new Error("closing process not completed"));
    } else {

        const libWinState = yield* selectTyped((state: RootState) => state.win.session.library);

        // if there is no libWin, so must be recreated
        if (
            libWinState.browserWindowId &&
            libWinState.identifier
        ) {

            const libWin = yield* callTyped(() => getLibraryWindowFromDi());

            if (libWin && !libWin.isDestroyed() && !libWin.webContents.isDestroyed()) {

                if (libWin.isMinimized()) {
                    libWin.restore();
                    libWin.show();
                } else if (libWin.isVisible()) {
                    libWin.show();
                } else {

                    // @todo useless ?

                    const readers = yield* selectTyped((state: RootState) => state.win.session.reader);
                    const readersArray = ObjectKeys(readers);
                    const readerWin = getReaderWindowFromDi(readersArray[0]);
                    if (readerWin && !readerWin.isDestroyed() && !readerWin.webContents.isDestroyed()) {
                        if (readerWin.isMinimized()) {
                            readerWin.restore();
                        }
                        readerWin.show();
                    }
                }

                return ;
            }
        }

        yield put(winActions.library.openRequest.build());

        // wait
        yield take(winActions.library.openSucess.ID);
    }

}

function* winOpen(action: winActions.library.openSucess.TAction) {

    const identifier = action.payload.identifier;
    debug(`library ${identifier} -> winOpen`);

    const libWindow = action.payload.win;
    const webContents = libWindow.webContents;
    const state = yield* selectTyped((_state: RootState) => _state);

    const payload: Partial<ILibraryRootState> = {
        i18n: state.i18n,
        keyboard: state.keyboard,
        theme: state.theme,
        wizard: state.wizard,
        win: {
            identifier,
        },
        publication: {
            catalog: {
                entries: [],
            },
            tag: [],
        },
        session: {
            // state: state.session.state,
            save: state.session.save,
        },
        screenReader: {
            activate: state.screenReader.activate,
        },
        creator: state.creator,
        settings: state.settings,
        lcp: state.lcp,
        noteExport: state.noteExport,
        customization: state.customization,
    };
    try {
        const publication = yield* callTyped(getCatalog);
        payload.publication = publication;
    } catch (e) {
        error(filename_, e);
    }
    // Send the id to the new window
    webContents.send(winIpc.CHANNEL, {
        type: winIpc.EventType.IdResponse,
        payload,
    } as winIpc.EventPayload);

    // send on redux library
    // TODO
    // will be replaced with preloaded state injection in Redux createStore.

    // // Send locale
    // webContents.send(syncIpc.CHANNEL, {
    //     type: syncIpc.EventType.MainAction,
    //     payload: {
    //         action: i18nActions.setLocale.build(state.i18n.locale),
    //         // useful ?
    //         // need ot at least pass it in payload instead
    //     },
    // } as syncIpc.EventPayload);

    // // Send keyboard shortcuts
    // webContents.send(syncIpc.CHANNEL, {
    //     type: syncIpc.EventType.MainAction,
    //     payload: {
    //         action: keyboardActions.setShortcuts.build(state.keyboard.shortcuts, false),
    //     },
    // } as syncIpc.EventPayload);

    // // Init network on window
    // let actionNet = null;

    // switch (state.net.status) {
    //     case NetStatus.Online:
    //         actionNet = netActions.online.build();
    //         break;
    //     case NetStatus.Offline:
    //     default:
    //         actionNet = netActions.offline.build();
    //         break;
    // }

    // // Send network status
    // webContents.send(syncIpc.CHANNEL, {
    //     type: syncIpc.EventType.MainAction,
    //     payload: {
    //         action: actionNet,
    //     },
    // } as syncIpc.EventPayload);

    // // Send update info
    // webContents.send(syncIpc.CHANNEL, {
    //     type: syncIpc.EventType.MainAction,
    //     payload: {
    //         action: {
    //             type: updateActions.latestVersion.ID,
    //             payload: updateActions.latestVersion.build(
    //                 state.update.status,
    //                 state.update.latestVersion,
    //                 state.update.latestVersionUrl),
    //         },
    //     },
    // } as syncIpc.EventPayload);

}

function* winClose(_action: winActions.library.closed.TAction) {

    debug("library -> winClose");

    const libraryWin = getLibraryWindowFromDi();
    let sessionSaving = false; // window.close() // not saved session by default

    {

        const readers = yield* selectTyped((state: RootState) => state.win.session.reader);
        const readersArray = ObjectValues(readers);
        debug("reader:", readersArray);

        if (readersArray.length) {

            // session always enabled by default
            // const sessionIsEnabled = yield* selectTyped((state: RootState) => state.session.state);
            // debug(sessionIsEnabled ? "session enabled destroy reader" : "session not enabled close reader");
            // if (sessionIsEnabled) {


                delay(100);
                sessionSaving = (yield* selectTyped((state: RootState) => state.session.save)) || false;
                // const messageValue = yield* callTyped(
                //     async () => {

                //         const translator = getTranslator();

                //         return dialog.showMessageBox(
                //             library,
                //             {
                //                 type: "question",
                //                 buttons: [
                //                     translator.translate("app.session.exit.askBox.button.no"),
                //                     translator.translate("app.session.exit.askBox.button.yes"),
                //                 ],
                //                 defaultId: 1,
                //                 title: translator.translate("app.session.exit.askBox.title"),
                //                 message: translator.translate("app.session.exit.askBox.help"),
                //             },
                //         );
                //     },
                // );
                // debug("result:", messageValue.response);
                // value = messageValue.response;
            // }

            yield all(
                readersArray.map(
                    (reader, index) => {
                        return call(function*() {

                            if (!reader) {
                                return;
                            }
                            try {
                                const readerWin = yield* callTyped(() => getReaderWindowFromDi(reader.identifier));
                                if (readerWin && !readerWin.isDestroyed() && !readerWin.webContents.isDestroyed()) {
                                if (sessionSaving) {
                                    // force quit the reader windows to keep session in next startup
                                    debug("destroy reader", index);
                                    readerWin.destroy();
                                } else {
                                    debug("close reader", index);
                                    readerWin.close();
                                }
                                }
                            } catch (_err) {
                                // ignore
                            }

                        });
                    },
                ),
            );

        }
    }

    if (libraryWin && libraryWin.getChildWindows()?.length) {
        debug("WIN CHILDREN ", libraryWin.getChildWindows()?.length, libraryWin.isDestroyed(), libraryWin.webContents.isDestroyed());
        for (const child of libraryWin.getChildWindows()) {
            try {
                child.destroy();
            } catch (_e) {
                // ignore
            }
        }
        yield delay(50);
    }

    if (sessionSaving) {
        if (libraryWin && !libraryWin.isDestroyed() && !libraryWin.webContents.isDestroyed()) {
            libraryWin.destroy();
        }
    } else {

        yield spawn(function* () {

            let readersArray: IWinSessionReaderState[];

            do {
                yield delay(50);
                const readers = yield* selectTyped((state: RootState) => state.win.session.reader);
                readersArray = ObjectValues(readers);

            } while (readersArray.length);

            if (libraryWin && !libraryWin.isDestroyed() && !libraryWin.webContents.isDestroyed()) {
                libraryWin.destroy();
            }
        });

    }
}

export function saga() {

    const appActivateChannel = getAppActivateEventChannel();

    return all([
        takeSpawnLeading(
            winActions.library.openRequest.ID,
            createLibraryWindow,
            (e) => error(filename_ + ":createLibraryWindow", e),
        ),
        takeSpawnLeading(
            winActions.library.openRequest.ID,
            checkReaderWindowInSession,
            (e) => error(filename_ + ":checkReaderWindowInSession", e),
        ),
        takeSpawnLeading(
            winActions.library.openSucess.ID,
            winOpen,
            (e) => error(filename_ + ":winOpen", e),
        ),
        takeSpawnEveryChannel(
            appActivateChannel,
            appActivate,
            (e) => error(filename_ + ":appActivateChannel", e),
        ),
        takeSpawnLeading(
            winActions.library.closed.ID,
            winClose,
            (e) => error(filename_ + ":winClose", e),
        ),
    ]);
}
