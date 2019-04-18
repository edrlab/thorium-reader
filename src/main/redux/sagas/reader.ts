// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import * as path from "path";
import * as uuid from "uuid";

import { BrowserWindow, webContents } from "electron";
import { SagaIterator } from "redux-saga";
import { call, put, take } from "redux-saga/effects";

import { convertHttpUrlToCustomScheme } from "@r2-navigator-js/electron/common/sessions";
import { trackBrowserWindow } from "@r2-navigator-js/electron/main/browser-window-tracker";
import { encodeURIComponent_RFC3986 } from "@r2-utils-js/_utils/http/UrlUtils";

import { Publication } from "readium-desktop/common/models/publication";
import { Bookmark, Reader, ReaderConfig } from "readium-desktop/common/models/reader";
import { readerActions } from "readium-desktop/common/redux/actions";

import { WinRegistry } from "readium-desktop/main/services/win-registry";

import { LocatorType } from "readium-desktop/common/models/locator";

import { ConfigRepository } from "readium-desktop/main/db/repository/config";
import { LocatorRepository } from "readium-desktop/main/db/repository/locator";
import { container } from "readium-desktop/main/di";
import { appActions, streamerActions } from "readium-desktop/main/redux/actions";
import {
    _NODE_MODULE_RELATIVE_URL,
    _PACKAGING,
    _RENDERER_READER_BASE_URL,
    IS_DEV,
} from "readium-desktop/preprocessor-directives";

import { AppWindowType } from "readium-desktop/common/models/win";

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
    const winRegistry = container.get("win-registry") as WinRegistry;
    winRegistry.registerWindow(readerWindow, AppWindowType.Reader);

    // Track it
    trackBrowserWindow(readerWindow);

    const pathBase64 = manifestUrl.replace(/.*\/pub\/(.*)\/manifest.json/, "$1");
    const pathDecoded = new Buffer(decodeURIComponent(pathBase64), "base64").toString("utf8");

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

    const htmlPath = "index_reader.html";

    if (readerUrl === "file://") {
        // dist/prod mode (without WebPack HMR Hot Module Reload HTTP server)
        readerUrl += path.normalize(path.join(__dirname, htmlPath));
    } else {
        // dev/debug mode (with WebPack HMR Hot Module Reload HTTP server)
        readerUrl += htmlPath;
    }

    readerUrl = readerUrl.replace(/\\/g, "/");
    readerUrl += `?pub=${encodedManifestUrl}&pubId=${publication.identifier}`;

    // Get publication last reading location
    const locatorRepository = container
            .get("locator-repository") as LocatorRepository;
    const locators = await locatorRepository
        .findByPublicationIdentifierAndLocatorType(
        publication.identifier,
        LocatorType.LastReadingLocation,
    );

    if (locators.length > 0) {
        const locator = locators[0];
        const docHref = encodeURIComponent_RFC3986(Buffer.from(locator.locator.href).toString("base64"));
        const docSelector =
            encodeURIComponent_RFC3986(Buffer.from(locator.locator.locations.cssSelector).toString("base64"));
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

        console.log("#### Reader open request");
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
        const configValue: ReaderConfig = action.payload.config;
        const config = {
            identifier: "reader",
            value: configValue,
        };

        // Get reader settings
        const configRepository = container
            .get("config-repository") as ConfigRepository;

        try {
            yield call(() => configRepository.save(config));
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

    const configRepository: ConfigRepository = container
        .get("config-repository") as ConfigRepository;

    try {
        const readerConfig = yield call(() => configRepository.get("reader"));

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
        const bookmark = action.payload.bookmark as Bookmark;

        // Get bookmark manager
        const locatorRepository = container
            .get("locator-repository") as LocatorRepository;

        try {
            const locator = {
                locator: {
                    href: bookmark.docHref,
                    locations: {
                        cssSelector: bookmark.docSelector,
                    },
                },
                publicationIdentifier: bookmark.publication.identifier,
                locatorType: LocatorType.LastReadingLocation,
            };
            yield call(() => locatorRepository.save(locator));
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
