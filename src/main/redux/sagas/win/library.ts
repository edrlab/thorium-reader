// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { app, dialog } from "electron";
import { error } from "readium-desktop/common/error";
import { syncIpc, winIpc } from "readium-desktop/common/ipc";
import { i18nActions, keyboardActions } from "readium-desktop/common/redux/actions";
import { callTyped, selectTyped } from "readium-desktop/common/redux/typed-saga";
import { diMainGet, getLibraryWindowFromDi, getReaderWindowFromDi } from "readium-desktop/main/di";
import { winActions } from "readium-desktop/main/redux/actions";
import { RootState } from "readium-desktop/main/redux/states";
import { ObjectValues } from "readium-desktop/utils/object-keys-values";
import { eventChannel } from "redux-saga";
import { all, call, put, take, takeLeading } from "redux-saga/effects";

import { createLibraryWindow } from "./browserWindow/createLibraryWindow";
import { checkReaderWindowInSession } from "./session/checkReaderWindowInSession";

// Logger
const filename_ = "readium-desktop:main:redux:sagas:win:library";
const debug = debug_(filename_);
debug("_");

// On OS X it's common to re-create a window in the app when the dock icon is clicked and there are no other
// windows open.
function* appActivate() {

    const appActivateChannel = eventChannel<void>(
        (emit) => {

            const handler = () => emit();
            app.on("activate", handler);

            return () => {
                app.removeListener("activate", handler);
            };
        },
    );

    yield take(appActivateChannel);

    yield put(winActions.library.openRequest.build());
}

function* winOpen(action: winActions.library.openSucess.TAction) {

    const identifier = action.payload.identifier;
    debug(`library ${identifier} -> winOpen`);

    const libWindow = action.payload.win;
    const webContents = libWindow.webContents;
    const state = yield* selectTyped((_state: RootState) => _state);

    // Send the id to the new window
    webContents.send(winIpc.CHANNEL, {
        type: winIpc.EventType.IdResponse,
        payload: {
            identifier,
        },
    } as winIpc.EventPayload);

    // send on redux library
    // TODO
    // will be replaced with preloaded state injection in Redux createStore.

    // Send locale
    webContents.send(syncIpc.CHANNEL, {
        type: syncIpc.EventType.MainAction,
        payload: {
            action: i18nActions.setLocale.build(state.i18n.locale),
        },
    } as syncIpc.EventPayload);

    // Send keyboard shortcuts
    webContents.send(syncIpc.CHANNEL, {
        type: syncIpc.EventType.MainAction,
        payload: {
            action: keyboardActions.setShortcuts.build(state.keyboard.shortcuts, false),
        },
    } as syncIpc.EventPayload);

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

    debug(`library -> winClose`);

    const library = getLibraryWindowFromDi();

    const readers = yield* selectTyped((state: RootState) => state.win.session.reader);
    const readersArray = ObjectValues(readers);

    if (readersArray.length) {

        const value = yield* callTyped(
            async () => {

                const translator = diMainGet("translator");

                return dialog.showMessageBox(
                    library,
                    {
                        type: "question",
                        buttons: [
                            translator.translate("app.session.exit.askBox.button.no"),
                            translator.translate("app.session.exit.askBox.button.yes"),
                        ],
                        defaultId: 1,
                        title: translator.translate("app.session.exit.askBox.title"),
                        message: translator.translate("app.session.exit.askBox.message"),
                    },
                );
            },
        );
        debug("result:", value.response);

        for (const key in readers) {
            if (readers[key]) {

                try {
                    const readerWin = yield* callTyped(() => getReaderWindowFromDi(readers[key].identifier));

                    if (value.response === 1) {
                        // force quit the reader windows to keep session in next startup
                        readerWin.destroy();
                    } else {
                        readerWin.close();
                    }
                } catch (_err) {
                    // ignore
                }
            }
        }
    }

    // end of cycle
    // closed the library
    library.destroy();
}

function* openLibraryWatcher() {

    try {

        yield all([
            takeLeading(winActions.library.openRequest.ID, createLibraryWindow),
            takeLeading(winActions.library.openRequest.ID, checkReaderWindowInSession),
            takeLeading(winActions.library.openSucess.ID, winOpen),
        ]);
    } catch (err) {
        error(filename_ + ":openLibraryWatcher", err);
    }
}

function* closedLibraryWatcher() {

    try {

        yield all([
            takeLeading(winActions.library.closed.ID, appActivate),
            takeLeading(winActions.library.closed.ID, winClose),
    ]);
    } catch (err) {
        error(filename_ + ":closedLibraryWatcher", err);
    }
}

export function* watchers() {
    yield all([
        call(openLibraryWatcher),
        call(closedLibraryWatcher),
    ]);
}
