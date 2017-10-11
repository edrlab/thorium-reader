import * as path from "path";
import { Store } from "redux";

import { app, BrowserWindow, protocol } from "electron";

import * as catalogActions from "readium-desktop/actions/catalog";

import { container } from "readium-desktop/main/di";
import { AppState } from "readium-desktop/main/reducers";
import { PublicationStorage } from "readium-desktop/main/storage/publication-storage";

// Preprocessing directive
declare const __RENDERER_BASE_URL__: string;
declare const __NODE_ENV__: string;

// Global reference to the main window,
// so the garbage collector doesn't close it.
let mainWindow: Electron.BrowserWindow = null;

// Opens the main window, with a native menu bar.
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true, // Required to use IPC
            webSecurity: false,
            allowRunningInsecureContent: false,
        },
    });

    let rendererBaseUrl = __RENDERER_BASE_URL__;

    if (rendererBaseUrl === "file://") {
        // This is a local url
        rendererBaseUrl += path.normalize(path.join(__dirname, "index.html"));
    } else {
        // This is a remote url
        rendererBaseUrl += "index.html";
    }

    mainWindow.loadURL(rendererBaseUrl);

    if (__NODE_ENV__ === "DEV") {
        mainWindow.webContents.openDevTools();
    }

    // Clear all cache to prevent weird behaviours
    mainWindow.webContents.session.clearStorageData();

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
    createWindow();
    registerProtocol();

    // Load catalog
    const store: Store<AppState> = container.get("store") as Store<AppState>;
    store.dispatch(catalogActions.init());
});

// On OS X it's common to re-create a window in the app when the dock icon is clicked and there are no other
// windows open.
app.on("activate", () => {
    if (mainWindow === null) {
        createWindow();
    }
});
