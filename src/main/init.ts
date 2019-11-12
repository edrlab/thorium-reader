// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import * as debug_ from "debug";
import { app, protocol } from "electron";
import * as path from "path";
import { LocaleConfigIdentifier, LocaleConfigRepositoryType } from "readium-desktop/common/config";
import { syncIpc, winIpc } from "readium-desktop/common/ipc";
import { ReaderMode } from "readium-desktop/common/models/reader";
import { AppWindow, AppWindowType } from "readium-desktop/common/models/win";
import {
    i18nActions, netActions, readerActions, updateActions,
} from "readium-desktop/common/redux/actions";
import { NetStatus } from "readium-desktop/common/redux/states/net";
import { AvailableLanguages } from "readium-desktop/common/services/translator";
import { diMainGet } from "readium-desktop/main/di";
import { appActions } from "readium-desktop/main/redux/actions/";

// Logger
const debug = debug_("readium-desktop:main");

// Callback called when a window is opened
const winOpenCallback = (appWindow: AppWindow) => {
    // Send information to the new window
    const store = diMainGet("store");
    const webContents = appWindow.win.webContents;

    // Send the id to the new window
    webContents.send(winIpc.CHANNEL, {
        type: winIpc.EventType.IdResponse,
        payload: {
            winId: appWindow.identifier,
        },
    } as winIpc.EventPayload);

    // Init network on window
    const state = store.getState();
    let actionNet = null;

    switch (state.net.status) {
        case NetStatus.Online:
            actionNet = netActions.online.build();
            break;
        case NetStatus.Offline:
        default:
            actionNet = netActions.offline.build();
            break;
    }

    // Send network status
    webContents.send(syncIpc.CHANNEL, {
        type: syncIpc.EventType.MainAction,
        payload: {
            action: actionNet,
        },
    } as syncIpc.EventPayload);

    // Send reader information
    webContents.send(syncIpc.CHANNEL, {
        type: syncIpc.EventType.MainAction,
        payload: {
            action: readerActions.openSuccess.build(state.reader.readers[appWindow.identifier]),
        },
    } as syncIpc.EventPayload);

    // Send reader config
    webContents.send(syncIpc.CHANNEL, {
        type: syncIpc.EventType.MainAction,
        payload: {
            action: readerActions.configSetSuccess.build(state.reader.config),
        },
    } as syncIpc.EventPayload);

    // Send reader mode
    webContents.send(syncIpc.CHANNEL, {
        type: syncIpc.EventType.MainAction,
        payload: {
            action: readerActions.detachModeSuccess.build(state.reader.mode),
        },
    } as syncIpc.EventPayload);

    // Send locale
    webContents.send(syncIpc.CHANNEL, {
        type: syncIpc.EventType.MainAction,
        payload: {
            action: i18nActions.setLocale.build(state.i18n.locale),
        },
    } as syncIpc.EventPayload);

    // Send locale
    webContents.send(syncIpc.CHANNEL, {
        type: syncIpc.EventType.MainAction,
        payload: {
            action: {
                type: updateActions.latestVersion.ID,
                payload: updateActions.latestVersion.build(
                    state.update.status,
                    state.update.latestVersion,
                    state.update.latestVersionUrl),
            },
        },
    } as syncIpc.EventPayload);
};

// Callback called when a window is closed
const winCloseCallback = (appWindow: AppWindow) => {
    const store = diMainGet("store");
    const winRegistry = diMainGet("win-registry");
    const appWindows = winRegistry.getWindows();

    // if multiple windows are open & library are closed. all other windows are closed
    if (Object.keys(appWindows).length >= 1 &&
        appWindow.type === AppWindowType.Library) {
        for (let nbWindow = Object.keys(appWindows).length - 1;
            nbWindow >= 0; nbWindow--) {
            Object.values(appWindows)[nbWindow].win.close();
        }
        return;
    }

    if (Object.keys(appWindows).length !== 1) {
        return;
    }

    const appWin = Object.values(appWindows)[0];
    if (appWin.type === AppWindowType.Library) {
        // Set reader to attached mode
        store.dispatch(readerActions.detachModeSuccess.build(ReaderMode.Attached));
    }

    if (
        appWin.type === AppWindowType.Library &&
        !appWin.win.isVisible()
    ) {
        // Library window is hidden
        // There is no more opened window
        // Consider that we close application
        appWin.win.close();
    }
};

// Initialize application
export function initApp() {
    const store = diMainGet("store");
    store.dispatch(appActions.initRequest.build());

    const configRepository: LocaleConfigRepositoryType = diMainGet("config-repository");
    const config = configRepository.get(LocaleConfigIdentifier);
    config.then((i18nLocale) => {
        if (i18nLocale && i18nLocale.value && i18nLocale.value.locale) {
            store.dispatch(i18nActions.setLocale.build(i18nLocale.value.locale));
            debug(`set the locale ${i18nLocale.value.locale}`);
        } else {
            debug(`error on configRepository.get("i18n")): ${i18nLocale}`);
        }
    }).catch(async () => {
        const loc = app.getLocale().split("-")[0];
        const lang = Object.keys(AvailableLanguages).find((l) => l === loc) || "en";
        store.dispatch(i18nActions.setLocale.build(lang));
        debug(`create i18n key in configRepository with ${lang} locale`);
    });

    const winRegistry = diMainGet("win-registry");
    winRegistry.registerOpenCallback(winOpenCallback);
    winRegistry.registerCloseCallback(winCloseCallback);
    app.setAppUserModelId("io.github.edrlab.thorium");
}

export function registerProtocol() {
    protocol.registerFileProtocol("store", (request, callback) => {
        // Extract publication item relative url
        const relativeUrl = request.url.substr(6);
        const pubStorage = diMainGet("publication-storage");
        const filePath: string = path.join(pubStorage.getRootPath(), relativeUrl);
        callback(filePath);
    });
}
