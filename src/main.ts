// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import { syncIpc } from "readium-desktop/common/ipc";
import { ActionSerializer } from "readium-desktop/common/services/serializer";
import { cli_ } from "readium-desktop/main/cli/commandLine";
import { cli } from "readium-desktop/main/cli/process";
import { createWindow } from "readium-desktop/main/createWindow";
import { container } from "readium-desktop/main/di";
import { initApp, registerProtocol } from "readium-desktop/main/init";
import { _PACKAGING, _RENDERER_APP_BASE_URL } from "readium-desktop/preprocessor-directives";
import { Store } from "redux";

import { setLcpNativePluginPath } from "@r2-lcp-js/parser/epub/lcp";
import { initSessions } from "@r2-navigator-js/electron/main/sessions";
import { initGlobalConverters_OPDS } from "@r2-opds-js/opds/init-globals";
import {
    initGlobalConverters_GENERIC, initGlobalConverters_SHARED,
} from "@r2-shared-js/init-globals";

if (_PACKAGING !== "0") {
    // Disable debug in packaged app
    delete process.env.DEBUG;
    debug_.disable();
}

// Logger
const debug = debug_("readium-desktop:main");

// Global
initGlobalConverters_OPDS();
initGlobalConverters_SHARED();
initGlobalConverters_GENERIC();

// Lcp
const lcpNativePluginPath = path.normalize(path.join(__dirname, "external-assets", "lcp.node"));
setLcpNativePluginPath(lcpNativePluginPath);

// Global reference to the main window,
// so the garbage collector doesn't close it.
// tslint:disable-next-line: prefer-const
let mainWindow: BrowserWindow = null;

cli(main);

function main() {

    initSessions();

    // Quit when all windows are closed.
    app.on("window-all-closed", () => {
        // At the moment, there are no menu items to revive / re-open windows,
        // so let's terminate the app on MacOS too.
        // if (process.platform !== "darwin") {
        //     app.quit();
        // }
        app.quit();
    });

    // Call 'createWindow()' on startup.
    app.on("ready", async () => {
        debug("ready");
        initApp();

        // launch library window
        await createWindow({ mainWindow });
        registerProtocol();
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

            if (!await cli_(filePath)) {
                debug(`the open-file event with ${filePath} return an error`);
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
