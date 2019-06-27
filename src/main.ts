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

import { OpdsApi } from "readium-desktop/main/api/opds";

import { appInit } from "readium-desktop/main/redux/actions/app";
import { RootState } from "readium-desktop/main/redux/states";
import { WinRegistry } from "readium-desktop/main/services/win-registry";

import { syncIpc, winIpc } from "readium-desktop/common/ipc";

import {
    i18nActions,
    netActions,
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

import { ReaderMode } from "readium-desktop/common/models/reader";

import { ActionSerializer } from "readium-desktop/common/services/serializer";

import { CatalogService } from "readium-desktop/main/services/catalog";

import { AppWindow, AppWindowType } from "readium-desktop/common/models/win";
import { getWindowsRectangle, savedWindowsRectangle } from "./common/rectangle/window";
import { debounce } from "./utils/debounce";

// Logger
const debug = debug_("readium-desktop:main");

// Parse command line
const processArgs = yargs.argv;

initGlobalConverters_OPDS();
initGlobalConverters_SHARED();
initGlobalConverters_GENERIC();

const lcpNativePluginPath = path.normalize(path.join(__dirname, "external-assets", "lcp.node"));
setLcpNativePluginPath(lcpNativePluginPath);

// Global reference to the main window,
// so the garbage collector doesn't close it.
let mainWindow: BrowserWindow = null;
let mainWindowId: any = null;

initSessions();

// Initialize application
function initApp() {
    (container.get("store") as Store<any>).dispatch(appInit());
    const winRegistry = container.get("win-registry") as WinRegistry;
    winRegistry.registerOpenCallback(winOpenCallback);
    winRegistry.registerCloseCallback(winCloseCallback);
    app.setAppUserModelId("io.github.edrlab.thorium");
}

// Opens the main window, with a native menu bar.
async function createWindow() {
    mainWindow = new BrowserWindow({
        ...(await getWindowsRectangle()),
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            devTools: IS_DEV,
            nodeIntegration: true, // Required to use IPC
            webSecurity: false,
            allowRunningInsecureContent: false,
        },
        icon: path.join(__dirname, "assets/icons/icon.ico"),
    });
    const winRegistry = container.get("win-registry") as WinRegistry;
    winRegistry.registerWindow(mainWindow, AppWindowType.Library);

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
        mainWindowId = null;
        mainWindow = null;
    });

    const debounceSavedWindowsRectangle = debounce(savedWindowsRectangle, 500);

    mainWindow.on("move", () =>
        debounceSavedWindowsRectangle(mainWindow.getBounds()));
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
app.on("ready", async () => {
    debug("ready");
    initApp();

    if (!processCommandLine()) {
        // Do not open window if electron is launched as a command line
        await createWindow();
        registerProtocol();
    }
});

// On OS X it's common to re-create a window in the app when the dock icon is clicked and there are no other
// windows open.
app.on("activate", async () => {
    if (mainWindow === null) {
        await createWindow();
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

// Callback called when a window is closed
const winCloseCallback = (appWindow: AppWindow) => {
    const store = container.get("store") as Store<RootState>;
    const winRegistry = container.get("win-registry") as WinRegistry;
    const appWindows = winRegistry.getWindows();

    if (Object.keys(appWindows).length !== 1) {
        return;
    }

    const appWin = Object.values(appWindows)[0];

    if (appWin.type === AppWindowType.Library) {
        // Set reader to attached mode
        store.dispatch({
            type: readerActions.ActionType.ModeSetSuccess,
            payload: {
                mode: ReaderMode.Attached,
            },
        });
    }

    if (
        appWin.type === AppWindowType.Library &&
        !appWin.win.isVisible()
    ) {
        // Library window is hidden
        // There is no more opened window
        // Consider that we close application
        Object.values(appWindows)[0].win.close();

    }
};

// Callback called when a window is opened
const winOpenCallback = (appWindow: AppWindow) => {
    // Send information to the new window
    const store = container.get("store") as Store<RootState>;
    const webContents = appWindow.win.webContents;

    // Send the id to the new window
    webContents.send(winIpc.CHANNEL, {
        type: winIpc.EventType.IdResponse,
        payload: {
            winId: appWindow.identifier,
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
    webContents.send(syncIpc.CHANNEL, {
        type: syncIpc.EventType.MainAction,
        payload: {
            action: {
                type: netActionType,
            },
        },
    });

    // Send reader information
    webContents.send(syncIpc.CHANNEL, {
        type: syncIpc.EventType.MainAction,
        payload: {
            action: {
                type: readerActions.ActionType.OpenSuccess,
                payload: {
                    reader: state.reader.readers[appWindow.identifier],
                },
            },
        },
    });

    // Send reader config
    webContents.send(syncIpc.CHANNEL, {
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

    // Send reader mode
    webContents.send(syncIpc.CHANNEL, {
        type: syncIpc.EventType.MainAction,
        payload: {
            action: {
                type: readerActions.ActionType.ModeSetSuccess,
                payload: {
                    mode: state.reader.mode,
                },
            },
        },
    });

    // Send locale
    webContents.send(syncIpc.CHANNEL, {
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
    webContents.send(syncIpc.CHANNEL, {
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
};

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
        promise = catalogService.importFile(processArgs.importFile as string);
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
