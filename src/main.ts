import * as path from "path";

import { app, BrowserWindow } from "electron";
import { ipcMain } from "electron";

import { Download } from "readium-desktop/downloader/download";
import { Downloader } from "readium-desktop/downloader/downloader";
import { OPDSParser } from "readium-desktop/services/opds";

import { Catalog } from "readium-desktop/models/catalog";

import {
    CATALOG_GET_REQUEST,
    CATALOG_GET_RESPONSE,
    PUBLICATION_DOWNLOAD_REQUEST,
} from "readium-desktop/events/ipc";
import { PublicationMessage } from "readium-desktop/models/ipc";
import { Publication } from "readium-desktop/models/publication";

import { container } from "readium-desktop/main/di";

// Preprocessing directive
declare const __RENDERER_BASE_URL__: string;

// Global reference to the main window,
// so the garbage collector doesn't close it.
let mainWindow: Electron.BrowserWindow = null;

// Opens the main window, with a native menu bar.
function createWindow() {
    mainWindow = new BrowserWindow({ width: 800, height: 600 });
    let rendererBaseUrl = __RENDERER_BASE_URL__;

    if (rendererBaseUrl === "file://") {
        // This is a local url
        rendererBaseUrl += path.normalize(path.join(__dirname, "index.html"));
    } else {
        // This is a remote url
        rendererBaseUrl += "index.html";
    }

    mainWindow.loadURL(rendererBaseUrl);
    mainWindow.webContents.openDevTools();

    mainWindow.on("closed", () => {
        mainWindow = null;
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
});

// On OS X it's common to re-create a window in the app when the dock icon is clicked and there are no other
// windows open.
app.on("activate", () => {
    if (mainWindow === null) {
        createWindow();
    }
});

// Retrieve services from DI container
const downloader: Downloader = container.get("downloader") as Downloader;
const opdsParser: OPDSParser = container.get("opds-parser") as OPDSParser;

const opdsUrl = "http://fr.feedbooks.com/books/top.atom?category=FBFIC019000&lang=fr";

ipcMain.on(CATALOG_GET_REQUEST, (event, msg) => {
    opdsParser
        .parse(opdsUrl)
        .then((catalog: Catalog) => {
            event.sender.send(CATALOG_GET_RESPONSE, {
                catalog,
            });
        });
});

ipcMain.on(PUBLICATION_DOWNLOAD_REQUEST, (event: any, msg: PublicationMessage) => {
    let pub: Publication = msg.publication;
    let epubType = "application/epub+zip";
    let url: string;
    let download: Download;

    for (let file of pub.files) {
        if (file.contentType === epubType) {
            url = file.url;
        }
    }
    if (url) {

        download = downloader.download(url);
    }
});
