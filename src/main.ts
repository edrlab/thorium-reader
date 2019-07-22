// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import { syncIpc, winIpc } from "readium-desktop/common/ipc";
import { ReaderMode } from "readium-desktop/common/models/reader";
import { SenderType } from "readium-desktop/common/models/sync";
import { AppWindow, AppWindowType } from "readium-desktop/common/models/win";
import {
    i18nActions, netActions, readerActions, updateActions,
} from "readium-desktop/common/redux/actions";
import { NetStatus } from "readium-desktop/common/redux/states/net";
import { ActionSerializer } from "readium-desktop/common/services/serializer";
import { OpdsApi } from "readium-desktop/main/api/opds";
import { cli } from "readium-desktop/main/cli/process";
import { createWindow } from "readium-desktop/main/createWindow";
import { container } from "readium-desktop/main/di";
import { initApp, registerProtocol } from "readium-desktop/main/init";
import { appInit } from "readium-desktop/main/redux/actions/app";
import { RootState } from "readium-desktop/main/redux/states";
import { CatalogService } from "readium-desktop/main/services/catalog";
import { WinRegistry } from "readium-desktop/main/services/win-registry";
import { PublicationStorage } from "readium-desktop/main/storage/publication-storage";
import {
    _PACKAGING, _RENDERER_APP_BASE_URL, IS_DEV,
} from "readium-desktop/preprocessor-directives";
import { Store } from "redux";
import * as yargs from "yargs";

import { setLcpNativePluginPath } from "@r2-lcp-js/parser/epub/lcp";
import { initSessions } from "@r2-navigator-js/electron/main/sessions";
import { initGlobalConverters_OPDS } from "@r2-opds-js/opds/init-globals";
import {
    initGlobalConverters_GENERIC, initGlobalConverters_SHARED,
} from "@r2-shared-js/init-globals";

import { getWindowsRectangle, savedWindowsRectangle } from "./common/rectangle/window";
import { setLocale } from "./common/redux/actions/i18n";
import { AvailableLanguages } from "./common/services/translator";
import { debounce } from "./utils/debounce";

if (_PACKAGING !== "0") {
    // Disable debug in packaged app
    delete process.env.DEBUG;
    debug_.disable();
}

// Logger
const debug = debug_("readium-desktop:main");

// Global reference to the main window,
// so the garbage collector doesn't close it.
// tslint:disable-next-line: prefer-const
let mainWindow: BrowserWindow = null;

cli(main);

function main() {

    initGlobalConverters_OPDS();
    initGlobalConverters_SHARED();
    initGlobalConverters_GENERIC();

    const lcpNativePluginPath = path.normalize(path.join(__dirname, "external-assets", "lcp.node"));
    setLcpNativePluginPath(lcpNativePluginPath);

    initSessions();

    // Quit when all windows are closed.
    app.on("window-all-closed", () => {
        if (process.platform !== "darwin") {
            app.quit();
        }
    });

    // Call 'createWindow()' on startup.
    app.on("ready", async () => {
        debug("ready");
        initApp();

        if (!/*(await processCommandLine(cli, yargs.argv))*/false) {

            // set the locale from platform
            const store = container.get("store") as Store<RootState>;
            const loc = app.getLocale().split("-")[0];
            const lang = Object.keys(AvailableLanguages).find((l) => l === loc) || "en";
            store.dispatch(setLocale(lang));

            // launch library window
            await createWindow({ mainWindow });
            registerProtocol();
        }
    });

    // On OS X it's common to re-create a window in the app when the dock icon is clicked and there are no other
    // windows open.
    app.on("activate", async () => {
        if (mainWindow === null) {
            await createWindow({ mainWindow });
        }
    });

    app.on("will-finish-launching", () => {
        app.on("open-url", (event: any, url: any) => {
            event.preventDefault();
            // Process url: import or open?
        });
        app.on("open-file", async (event: any, filePath) => {
            event.preventDefault();

            try {
                const catalogService = container.get("catalog-service") as CatalogService;
                const publication = await catalogService.importFile(filePath);
                const store = container.get("store") as Store<RootState>;
                if (publication) {
                    store.dispatch({
                        type: readerActions.ActionType.OpenRequest,
                        payload: {
                            publication: {
                                identifier: publication.identifier,
                            },
                        },
                    });
                }
            } catch (e) {
                debug(`Publication error for "${filePath}"`);
            }
        });
    });

    // Listen to renderer action
    ipcMain.on(syncIpc.CHANNEL, (_0: any, data: any) => {
        const store = container.get("store") as Store<any>;
        const actionSerializer = container.get("action-serializer") as ActionSerializer;

        switch (data.type) {
            case syncIpc.EventType.RendererAction:
                // Dispatch renderer action to main reducers
                store.dispatch(Object.assign(
                    {},
                    actionSerializer.deserialize(data.payload.action),
                    { sender: data.sender },
                ));
                break;
        }
    });
}
