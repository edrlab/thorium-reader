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

import { ConfigDb } from "readium-desktop/main/db/config-db";

import { Publication as StreamerPublication } from "@r2-shared-js/models/publication";

import { convertHttpUrlToCustomScheme } from "@r2-navigator-js/electron/common/sessions";

import { trackBrowserWindow } from "@r2-navigator-js/electron/main/browser-window-tracker";

import { readerActions } from "readium-desktop/common/redux/actions";

import { container } from "readium-desktop/main/di";

import { Server } from "@r2-streamer-js/http/server";

import { encodeURIComponent_RFC3986 } from "@r2-utils-js/_utils/http/UrlUtils";

import { PublicationStorage } from "readium-desktop/main/storage/publication-storage";

import { BookmarkManager } from "readium-desktop/main/services/bookmark";

import {
    _NODE_MODULE_RELATIVE_URL,
    _PACKAGING,
    _RENDERER_READER_BASE_URL,
    IS_DEV,
} from "readium-desktop/preprocessor-directives";

// Logger
const debug = debug_("readium-desktop:main:redux:sagas:reader");

function openAllDevTools() {
    for (const wc of webContents.getAllWebContents()) {
        // if (wc.hostWebContents &&
        //     wc.hostWebContents.id === electronBrowserWindow.webContents.id) {
        // }
        wc.openDevTools();
    }
}

async function openReader(publication: Publication, manifestUrl: string) {
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

    let readerUrl = _RENDERER_READER_BASE_URL;

    if (_PACKAGING === "0" && process.env.NAVIGATOR === "old") {
        readerUrl = "file://" + path.normalize(path.join(__dirname, _NODE_MODULE_RELATIVE_URL,
            "r2-testapp-js", "dist", "es6-es2015", "src", "electron", "renderer", "index.html"));
    } else {
        const htmlPath = "index_reader.html";

        if (readerUrl === "file://") {
            // dist/prod mode (without WebPack HMR Hot Module Reload HTTP server)
            readerUrl += path.normalize(path.join(__dirname, htmlPath));
        } else {
            // dev/debug mode (with WebPack HMR Hot Module Reload HTTP server)
            readerUrl += htmlPath;
        }
    }

    readerUrl = readerUrl.replace(/\\/g, "/");
    readerUrl += `?pub=${encodedManifestUrl}&pubId=${publication.identifier}`;

    // Get publication last reading location
    const bookmarkManager = container.get("bookmark-manager") as BookmarkManager;
    const bookmark = await bookmarkManager.getBookmark(
        publication.identifier,
        "reading-location",
    );

    if (bookmark) {
        const docHref = Buffer.from(bookmark.docHref).toString("base64");
        const docSelector = Buffer.from(bookmark.docSelector).toString("base64");
        readerUrl += `&docHref=${docHref}&docSelector=${docSelector}`;
    }

    readerWindow.webContents.loadURL(readerUrl, { extraHeaders: "pragma: no-cache\n" });

    if (IS_DEV) {
        readerWindow.webContents.openDevTools();
    } else {
        // Remove menu bar
        readerWindow.setMenu(null);
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
            // FIXME: Put publication in meta to be FSA compliant
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
        config.identifier = "reader";

        // Get Reader Settings db
        const configDb = container.get("config-db") as ConfigDb;

        try {
            yield call(() => configDb.putOrUpdate(config));
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

    // Get config db
    const configDb: ConfigDb = container.get(
    "config-db") as ConfigDb;

    try {
        const readerConfig = yield call(() => configDb.get("reader"));
        delete readerConfig._id;
        delete readerConfig._rev;

        // FIXME
        // Returns the first reader configuration available in database
        yield put({
            type: readerActions.ActionType.ConfigSetSuccess,
            payload: {
                config: readerConfig,
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

export function* readerBookmarkSaveRequestWatcher(): SagaIterator {
    while (true) {
        // Wait for app initialization
        const action = yield take(readerActions.ActionType.BookmarkSaveRequest);
        const bookmark = action.payload.bookmark;

        // Get bookmark manager
        const bookmarkManager = container.get("bookmark-manager") as BookmarkManager;

        try {
            yield call(() => bookmarkManager.saveBookmark(bookmark));
            yield put({
                type: readerActions.ActionType.BookmarkSaveSuccess,
                payload: {
                    bookmark,
                },
            });
        } catch (error) {
            yield put({
                type: readerActions.ActionType.BookmarkSaveError,
                payload: new Error(error),
                error: true,
            });
        }
    }
}
