import * as debug_ from "debug";
import * as path from "path";
import { Store } from "redux";

import { app, BrowserWindow, ipcMain, protocol } from "electron";

import { container } from "readium-desktop/main/di";

import { appInit } from "readium-desktop/main/redux/actions/app";
import { RootState } from "readium-desktop/main/redux/states";
import { WinRegistry } from "readium-desktop/main/services/win-registry";

import { syncIpc, winIpc } from "readium-desktop/common/ipc";

import {
    catalogActions,
    netActions,
    opdsActions,
    readerActions,
} from "readium-desktop/common/redux/actions";
import { NetStatus } from "readium-desktop/common/redux/states/net";

import { PublicationStorage } from "readium-desktop/main/storage/publication-storage";

import { initSessions } from "@r2-navigator-js/electron/main/sessions";

import { setLcpNativePluginPath } from "@r2-lcp-js/parser/epub/lcp";
import { initGlobals } from "@r2-shared-js/init-globals";

import { IS_DEV, _RENDERER_APP_BASE_URL } from "readium-desktop/preprocessor-directives";

// Logger
const debug = debug_("readium-desktop:main");

initGlobals();
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
    }

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
    createWindow();
    registerProtocol();
});

// On OS X it's common to re-create a window in the app when the dock icon is clicked and there are no other
// windows open.
app.on("activate", () => {
    if (mainWindow === null) {
        createWindow();
    }
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

            // Send catalog
            win.webContents.send(syncIpc.CHANNEL, {
                type: syncIpc.EventType.MainAction,
                payload: {
                    action: {
                        type: catalogActions.ActionType.SetSuccess,
                        payload: {
                            publications: state.catalog.publications,
                        },
                    },
                },
            });

            // Send opds feeds
            win.webContents.send(syncIpc.CHANNEL, {
                type: syncIpc.EventType.MainAction,
                payload: {
                    action: {
                        type: opdsActions.ActionType.SetSuccess,
                        payload: {
                            items: state.opds.items,
                        },
                    },
                },
            });

            // Send opds feeds
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

            break;
    }
});

// Listen to renderer action
ipcMain.on(syncIpc.CHANNEL, (_0: any, data: any) => {
    const store = container.get("store") as Store<any>;

    switch (data.type) {
        case syncIpc.EventType.RendererAction:
            // Dispatch renderer action to main reducers
            store.dispatch(data.payload.action);
            break;
    }
});
