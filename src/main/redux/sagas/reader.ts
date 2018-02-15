import * as debug_ from "debug";
import * as path from "path";
import * as uuid from "uuid";

import { BrowserWindow, ipcMain, webContents } from "electron";

import { channel, Channel, SagaIterator } from "redux-saga";
import { call, fork, put, select, take } from "redux-saga/effects";

import { appActions, streamerActions } from "readium-desktop/main/redux/actions";

import { RootState } from "readium-desktop/main/redux/states";

import { Publication } from "readium-desktop/common/models/publication";
import { Reader, ReaderConfig } from "readium-desktop/common/models/reader";

import { ReaderConfigDb } from "readium-desktop/main/db/reader-config-db";

import { Publication as StreamerPublication } from "@r2-shared-js/models/publication";

import { convertHttpUrlToCustomScheme } from "@r2-navigator-js/electron/common/sessions";

import { trackBrowserWindow } from "@r2-navigator-js/electron/main/browser-window-tracker";

import { readerActions } from "readium-desktop/common/redux/actions";

import { container } from "readium-desktop/main/di";

import { Server } from "@r2-streamer-js/http/server";

import { encodeURIComponent_RFC3986 } from "@r2-utils-js/_utils/http/UrlUtils";

import { PublicationStorage } from "readium-desktop/main/storage/publication-storage";

// Logger
const debug = debug_("readium-desktop:main:redux:sagas:reader");

// Preprocessing directive
declare const __RENDERER_BASE_URL__: string;
declare const __NODE_ENV__: string;
declare const __NODE_MODULE_RELATIVE_URL__: string;
declare const __PACKAGING__: string;
declare const __FORCEDEBUG__: string;

const IS_DEV = __FORCEDEBUG__ === "1" || __NODE_ENV__ === "DEV" ||
    __PACKAGING__ === "0" && (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");

// FIXME: __TODO_LCP_LSD__

// import { launchStatusDocumentProcessing } from "@r2-lcp-js/lsd/status-document-processing";
// import { lsdLcpUpdateInject } from "@r2-navigator-js/electron/main/lsd-injectlcpl";

// import { IStore } from "@r2-testapp-js/electron/common/store";
// import { StoreElectron } from "@r2-testapp-js/electron/common/store-electron";
// import { getDeviceIDManager } from "@r2-testapp-js/electron/main/lsd-deviceid-manager";
// const electronStoreLSD: IStore = new StoreElectron("readium2-testapp-lsd", {});
// const deviceIDManager = getDeviceIDManager(electronStoreLSD, "Readium2 Electron desktop app");

    // (async () => {
    //     const streamer: Server = container.get("streamer") as Server;

    //     let streamerPublication: StreamerPublication | undefined;
    //     try {
    //         streamerPublication = await streamer.loadOrGetCachedPublication(pathDecoded);
    //     } catch (err) {
    //         console.log(err);
    //     }
    //     let lcpHint: string | undefined;
    //     if (streamerPublication && streamerPublication.LCP) {
    //         try {
    //             await launchStatusDocumentProcessing(streamerPublication.LCP, deviceIDManager,
    //                 async (licenseUpdateJson: string | undefined) => {
    //                     console.log("launchStatusDocumentProcessing DONE.");

    //                 if (licenseUpdateJson) {
    //                     let res: string;
    //                     try {
    //                         res = await lsdLcpUpdateInject(licenseUpdateJson, streamerPublication, pathDecoded);
    //                         console.log("EPUB SAVED: " + res);
    //                     } catch (err) {
    //                         console.log(err);
    //                     }
    //                 }
    //             });
    //         } catch (err) {
    //             console.log(err);
    //         }
    //         if (streamerPublication.LCP.Encryption &&
    //             streamerPublication.LCP.Encryption.UserKey &&
    //             streamerPublication.LCP.Encryption.UserKey.TextHint) {
    //             lcpHint = streamerPublication.LCP.Encryption.UserKey.TextHint;
    //         }
    //         if (!lcpHint) {
    //             lcpHint = "LCP passphrase";
    //         }
    //     }

function openAllDevTools() {
    for (const wc of webContents.getAllWebContents()) {
        // if (wc.hostWebContents &&
        //     wc.hostWebContents.id === electronBrowserWindow.webContents.id) {
        // }
        wc.openDevTools();
    }
}

function openReader(publication: Publication, manifestUrl: string) {
    // Create reader window
    const readerWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            allowRunningInsecureContent: false,
            contextIsolation: false,
            devTools: IS_DEV,
            nodeIntegration: true,
            nodeIntegrationInWorker: false,
            sandbox: false,
            webSecurity: true,
            webviewTag: true,
        },
    });

    // Track it
    trackBrowserWindow(readerWindow);

    const pathBase64 = manifestUrl.replace(/.*\/pub\/(.*)\/manifest.json/, "$1");
    const pathDecoded = new Buffer(pathBase64, "base64").toString("utf8");

    // Create reader object
    const reader: Reader = {
        identifier: uuid.v4(),
        publication,
        manifestUrl,
        filesystemPath: pathDecoded,
        window: readerWindow,
    };

    // This triggers the origin-sandbox for localStorage, etc.
    manifestUrl = convertHttpUrlToCustomScheme(manifestUrl);

    // Load publication in reader window
    const encodedManifestUrl = encodeURIComponent_RFC3986(manifestUrl);

    let readerUrl = __RENDERER_BASE_URL__;

    if (__PACKAGING__ === "0" && process.env.NAVIGATOR === "old") {
        readerUrl = "file://" + path.normalize(path.join(__dirname, __NODE_MODULE_RELATIVE_URL__,
            "r2-testapp-js", "dist", "es6-es2015", "src", "electron", "renderer", "index.html"));
    } else {
        const htmlPath = "index_reader.html";

        if (readerUrl === "file://") {
            // dist/prod mode (without WebPack HMR Hot Module Reload HTTP server)
            readerUrl += path.normalize(path.join(__dirname, htmlPath));
        } else {
            // dev/debug mode (with WebPack HMR Hot Module Reload HTTP server)
            readerUrl = readerUrl.replace(":8080", ":8081");
            readerUrl += htmlPath;
        }
    }

    readerUrl = readerUrl.replace(/\\/g, "/");
    readerUrl += `?pub=${encodedManifestUrl}`;

    // FIXME: __TODO_LCP_LSD__
    // const lcpHint = false;
    // if (lcpHint) {
    //     readerUrl += "&lcpHint=" + encodeURIComponent_RFC3986(lcpHint);
    // }

    readerWindow.webContents.on("dom-ready", () => {
        console.log("readerWindow dom-ready " + pathDecoded + " : " + manifestUrl);
        // electronBrowserWindow.webContents.openDevTools();
    });

    readerWindow.webContents.loadURL(readerUrl, { extraHeaders: "pragma: no-cache\n" });

    if (IS_DEV) {
        readerWindow.webContents.openDevTools();

        // webview (preload) debug
        setTimeout(() => {
                openAllDevTools();
            }, 8000); // TODO: needs smarter method
    }

    return reader;
}

export function* readerOpenRequestWatcher(): SagaIterator {
    while (true) {
        const action = yield take(readerActions.ActionType.OpenRequest);
        const publication = action.payload.publication;

        // Notify the streamer to create a manifest fo this publication
        yield put(streamerActions.openPublication(
            publication,
        ));

        // Wait for the publication to be opened
        const streamerAction = yield take([
            streamerActions.ActionType.PublicationOpenSuccess,
            streamerActions.ActionType.PublicationOpenError,
        ]);

        if (streamerAction.error) {
            // Failed to open publication
            yield put({
                type: readerActions.ActionType.OpenError,
                payload: {
                    publication,
                },
            });
            continue;
        }

        const manifestUrl = streamerAction.payload.manifestUrl;
        const reader = yield call(
            () => openReader(publication, manifestUrl),
        );

        // Publication is opened in a new reader
        yield put({
            type: readerActions.ActionType.OpenSuccess,
            payload: {
                reader,
            },
        });
    }
}

export function* readerCloseRequestWatcher(): SagaIterator {
    while (true) {
        const action = yield take(readerActions.ActionType.CloseRequest);
        const reader = action.payload.reader;
        const publication = reader.publication;

        // Notify the streamer that a publication has been closed
        yield put(streamerActions.closePublication(
            publication,
        ));

        // Wait for the publication to be closed
        const streamerAction = yield take([
            streamerActions.ActionType.PublicationCloseSuccess,
            streamerActions.ActionType.PublicationCloseError,
        ]);

        if (streamerAction.error) {
            // Failed to close publication
            yield put({
                type: readerActions.ActionType.CloseError,
                payload: {
                    reader,
                },
            });
            continue;
        }

        yield put({
            type: readerActions.ActionType.CloseSuccess,
            payload: {
                reader,
            },
        });
    }
}

export function* readerConfigSetRequestWatcher(): SagaIterator {
    while (true) {
        // Wait for save request
        const action = yield take(readerActions.ActionType.ConfigSetRequest);
        const config: ReaderConfig = action.payload.config;

        // Get Reader Settings db
        const configDb: ReaderConfigDb = container.get(
        "reader-config-db") as ReaderConfigDb;

        try {
            const searchResult = yield call(() => configDb.getAll());
            if (searchResult.length > 0) {
                config.identifier = searchResult[0].identifier;
                yield call(() => configDb.update(config));
            } else {
                config.identifier = uuid.v4();
                yield call(() => configDb.put(config));
            }
            yield put({
                type: readerActions.ActionType.ConfigSetSuccess,
                payload: {
                    config,
                },
            });
        } catch (error) {
            yield put({ type: readerActions.ActionType.ConfigSetError, error: true });
        }
    }
}

export function* readerConfigInitWatcher(): SagaIterator {
    // Wait for app initialization
    yield take(appActions.ActionType.InitSuccess);

    // Get reader config db
    const readerConfigDb: ReaderConfigDb = container.get(
    "reader-config-db") as ReaderConfigDb;

    try {
        const searchResult = yield call(() => readerConfigDb.getAll());
        if (searchResult.length === 0) {
            // Use default config
            return;
        }

        // FIXME
        // Returns the first reader configuration available in database
        yield put({
            type: readerActions.ActionType.ConfigSetSuccess,
            payload: {
                config: searchResult[0],
            },
        });
    } catch (error) {
        yield put({
            type: readerActions.ActionType.ConfigSetError,
            payload: new Error(error),
            error: true,
        });
    }
}
