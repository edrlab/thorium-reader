// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";

import * as yargs from "yargs";

import { _PACKAGING, _RENDERER_APP_BASE_URL, IS_DEV } from "readium-desktop/preprocessor-directives";

if (_PACKAGING !== "0") {
    // Disable debug in packaged app
    delete process.env.DEBUG;
    debug_.disable();
}

import * as path from "path";
import { Store } from "redux";

import { app, BrowserWindow, ipcMain, Menu, protocol, shell } from "electron";

import { container } from "readium-desktop/main/di";

import { appInit } from "readium-desktop/main/redux/actions/app";
import { RootState } from "readium-desktop/main/redux/states";
import { WinRegistry } from "readium-desktop/main/services/win-registry";

import { syncIpc, winIpc } from "readium-desktop/common/ipc";

import {
    catalogActions,
    i18nActions,
    netActions,
    opdsActions,
    readerActions,
    updateActions,
} from "readium-desktop/common/redux/actions";
import { NetStatus } from "readium-desktop/common/redux/states/net";

import { PublicationStorage } from "readium-desktop/main/storage/publication-storage";

import { initSessions } from "@r2-navigator-js/electron/main/sessions";

import { setLcpNativePluginPath } from "@r2-lcp-js/parser/epub/lcp";

import {
    initGlobalConverters_GENERIC,
    initGlobalConverters_SHARED,
} from "@r2-shared-js/init-globals";

import {
    initGlobalConverters_OPDS,
} from "@r2-opds-js/opds/init-globals";

import { SenderType } from "readium-desktop/common/models/sync";

import { ActionSerializer } from "readium-desktop/common/services/serializer";

import { CatalogService } from "readium-desktop/main/services/catalog";

// Logger
const debug = debug_("readium-desktop:main");


// Parse command line
const processArgs = yargs.argv

initGlobalConverters_OPDS();
initGlobalConverters_SHARED();
initGlobalConverters_GENERIC();

const lcpNativePluginPath = path.normalize(path.join(__dirname, "external-assets", "lcp.node"));
setLcpNativePluginPath(lcpNativePluginPath);

// Global reference to the main window,
// so the garbage collector doesn't close it.
let mainWindow: BrowserWindow = null;

initSessions();

// Initialize application
function initApp() {
    (container.get("store") as Store<any>).dispatch(appInit());
}

// Opens the main window, with a native menu bar.
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            devTools: IS_DEV,
            nodeIntegration: true, // Required to use IPC
            webSecurity: false,
            allowRunningInsecureContent: false,
        },
    });

    let rendererBaseUrl = _RENDERER_APP_BASE_URL;

    if (rendererBaseUrl === "file://") {
        // dist/prod mode (without WebPack HMR Hot Module Reload HTTP server)
        rendererBaseUrl += path.normalize(path.join(__dirname, "index_app.html"));
    } else {
        // dev/debug mode (with WebPack HMR Hot Module Reload HTTP server)
        rendererBaseUrl += "index_app.html";
    }

    rendererBaseUrl = rendererBaseUrl.replace(/\\/g, "/");

    mainWindow.loadURL(rendererBaseUrl);

    // Create the app menu on mac os to allow copy paste
    if (process.platform === "darwin") {
        const template: any = [
            {
                label: app.getName(),
                submenu: [
                    {role: "quit"},
                ],
            },
            {
                label: "Edit",
                submenu: [
                    {role: "undo"},
                    {role: "redo"},
                    {type: "separator"},
                    {role: "cut"},
                    {role: "copy"},
                    {role: "paste"},
                    {role: "selectall"},
                ],
            },
        ];
        Menu.setApplicationMenu(Menu.buildFromTemplate(template));
    }

    if (IS_DEV) {
        const {
            default: installExtension,
            REACT_DEVELOPER_TOOLS,
            REDUX_DEVTOOLS,
        } = require("electron-devtools-installer");

        [REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS].forEach((extension) => {
            installExtension(extension)
                .then((name: string) => debug("Added Extension: ", name))
                .catch((err: any) => debug("An error occurred: ", err));
        });

        // Open dev tools in development environment
        mainWindow.webContents.openDevTools();
    } else {
        // Remove menu bar
        mainWindow.setMenu(null);
    }

    // Redirect link to an external browser
    const handleRedirect = (event: any, url: any) => {
        if (url === mainWindow.webContents.getURL()) {
            return;
        }

        event.preventDefault();
        shell.openExternal(url);
    };

    mainWindow.webContents.on("will-navigate", handleRedirect);
    mainWindow.webContents.on("new-window", handleRedirect);

    // Clear all cache to prevent weird behaviours
    // Fully handled in r2-navigator-js initSessions();
    // (including exit cleanup)
    // mainWindow.webContents.session.clearStorageData();

    mainWindow.on("closed", () => {
        mainWindow = null;
    });
}

function registerProtocol() {
    protocol.registerFileProtocol("store", (request, callback) => {
        // Extract publication item relative url
        const relativeUrl = request.url.substr(6);
        const pubStorage: PublicationStorage = container.get("publication-storage") as PublicationStorage;
        const filePath: string = path.join(pubStorage.getRootPath(), relativeUrl);
        callback(filePath);
    });
}

// Quit when all windows are closed.
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
},
);

// Call 'createWindow()' on startup.
app.on("ready", () => {
    debug("ready");
    initApp();

    if (!processCommandLine()) {
        // Do not open window if electron is launched as a command line
        createWindow();
        registerProtocol();
    }
});

// On OS X it's common to re-create a window in the app when the dock icon is clicked and there are no other
// windows open.
app.on("activate", () => {
    if (mainWindow === null) {
        createWindow();
    }
});

app.on("open-url", (event: any, url: any) => {
    event.preventDefault();
    // Process url: import or open?
});
app.on("open-file", (event: any, url: any) => {
    event.preventDefault();
    // Process file: import or open?
});

// Listen to a window that requests a new id
ipcMain.on(winIpc.CHANNEL, (event: any, data: any) => {
    const win: BrowserWindow = event.sender;
    const store = container.get("store") as Store<RootState>;
    const winRegistry = container.get("win-registry") as WinRegistry;

    switch (data.type) {
        case winIpc.EventType.IdRequest:
            const winId = winRegistry.registerWindow(win);

            win.on("closed", () => {
                winRegistry.unregisterWindow(winId);
            });

            // Send the id to the new window
            win.webContents.send(winIpc.CHANNEL, {
                type: winIpc.EventType.IdResponse,
                payload: {
                    winId,
                },
            });

            // Init network on window
            const state = store.getState();
            let netActionType = null;

            switch (state.net.status) {
                case NetStatus.Online:
                    netActionType = netActions.ActionType.Online;
                    break;
                case NetStatus.Online:
                    netActionType = netActions.ActionType.Offline;
                    break;
            }

            // Send network status
            win.webContents.send(syncIpc.CHANNEL, {
                type: syncIpc.EventType.MainAction,
                payload: {
                    action: {
                        type: netActionType,
                    },
                },
            });

            // Send reader config
            win.webContents.send(syncIpc.CHANNEL, {
                type: syncIpc.EventType.MainAction,
                payload: {
                    action: {
                        type: readerActions.ActionType.ConfigSetSuccess,
                        payload: {
                            config: state.reader.config,
                        },
                    },
                },
            });

            // Send locale
            win.webContents.send(syncIpc.CHANNEL, {
                type: syncIpc.EventType.MainAction,
                payload: {
                    action: {
                        type: i18nActions.ActionType.Set,
                        payload: {
                            locale: state.i18n.locale,
                        },
                    },
                },
            });

            // Send locale
            win.webContents.send(syncIpc.CHANNEL, {
                type: syncIpc.EventType.MainAction,
                payload: {
                    action: {
                        type: updateActions.ActionType.LatestVersionSet,
                        payload: {
                            status: state.update.status,
                            latestVersion: state.update.latestVersion,
                            latestVersionUrl: state.update.latestVersionUrl,
                        },
                    },
                },
            });

            break;
    }
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
                {sender: data.sender},
            ));
            break;
    }
});

function processCommandLine() {
    let promise = null;

    if ("importFile" in processArgs) {
        const catalogService = container.get("catalog-service") as CatalogService;
        promise = catalogService.importFile(processArgs["importFile"]);
    }

    if (promise == null) {
        return false;
    }

    promise.then((result: any) => {
        debug("Command processed");
        app.quit();
    })
    .catch((error) => {
        debug("Command failed", error);
        app.quit();
    });

    return true;
}
