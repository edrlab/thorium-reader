// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { BrowserWindow, Menu } from "electron";
import * as path from "path";
import { LocatorType } from "readium-desktop/common/models/locator";
import { Bookmark, Reader, ReaderConfig, ReaderMode } from "readium-desktop/common/models/reader";
import { Action } from "readium-desktop/common/models/redux";
import { ActionWithSender } from "readium-desktop/common/models/sync";
import { Timestampable } from "readium-desktop/common/models/timestampable";
import { AppWindow, AppWindowType } from "readium-desktop/common/models/win";
import { getWindowsRectangle } from "readium-desktop/common/rectangle/window";
import { readerActions } from "readium-desktop/common/redux/actions";
import {
    ActionPayloadReaderMainConfigSetSuccess, ActionPayloadReaderMainModeSetSuccess,
    CloseActionPayload, CloseReaderActionPayload, DetachActionPayload, SaveBookmarkActionPayload,
    SetConfigActionPayload,
} from "readium-desktop/common/redux/actions/reader";
import { callTyped, takeTyped } from "readium-desktop/common/redux/typed-saga";
import { PublicationView } from "readium-desktop/common/views/publication";
import { ConfigDocument } from "readium-desktop/main/db/document/config";
import { BaseRepository } from "readium-desktop/main/db/repository/base";
import { diMainGet } from "readium-desktop/main/di";
import { setMenu } from "readium-desktop/main/menu";
import { appActions, streamerActions } from "readium-desktop/main/redux/actions";
import { ReaderState } from "readium-desktop/main/redux/states/reader";
import {
    _NODE_MODULE_RELATIVE_URL, _PACKAGING, _RENDERER_READER_BASE_URL, _VSCODE_LAUNCH, IS_DEV,
} from "readium-desktop/preprocessor-directives";
import { SagaIterator } from "redux-saga";
import { all, call, put, take } from "redux-saga/effects";

import { convertHttpUrlToCustomScheme } from "@r2-navigator-js/electron/common/sessions";
import { trackBrowserWindow } from "@r2-navigator-js/electron/main/browser-window-tracker";
import { encodeURIComponent_RFC3986 } from "@r2-utils-js/_utils/http/UrlUtils";

import {
    ActionPayloadStreamerPublicationCloseSuccess, ActionPayloadStreamerPublicationOpenSuccess,
} from "../actions/streamer";

// Logger
const debug = debug_("readium-desktop:main:redux:sagas:reader");

async function openReader(publicationView: PublicationView, manifestUrl: string) {
    debug("create readerWindow");
    // Create reader window
    const readerWindow = new BrowserWindow({
        ...(await getWindowsRectangle()),
        minWidth: 800,
        minHeight: 600,
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
        icon: path.join(__dirname, "assets/icons/icon.png"),
    });

    if (IS_DEV) {
        readerWindow.webContents.on("context-menu", (_ev, params) => {
            const { x, y } = params;
            Menu.buildFromTemplate([{
                label: "Inspect element",
                click: () => {
                    readerWindow.webContents.inspectElement(x, y);
                },
            }]).popup({window: readerWindow});
        });
    }

    const winRegistry = diMainGet("win-registry");
    const appWindows = winRegistry.getWindows();

    // If this is the only window, hide library window by default
    if (Object.keys(appWindows).length === 1) {
        const appWindow = Object.values(appWindows)[0];
        appWindow.win.hide();
    }

    // Register reader window
    const readerAppWindow = winRegistry.registerWindow(
        readerWindow,
        AppWindowType.Reader,
        );

    // If there are 2 win, record window position in the db
    if (Object.keys(appWindows).length === 2) {
        readerAppWindow.onWindowMoveResize.attach();
    }

    // Track it
    trackBrowserWindow(readerWindow);

    const pathBase64 = manifestUrl.replace(/.*\/pub\/(.*)\/manifest.json/, "$1");
    const pathDecoded = Buffer.from(decodeURIComponent(pathBase64), "base64").toString("utf8");

    // Create reader object
    const reader: Reader = {
        identifier: readerAppWindow.identifier,
        publicationView,
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
    readerUrl += `?pub=${encodedManifestUrl}&pubId=${publicationView.identifier}`;

    // Get publication last reading location
    const locatorRepository = diMainGet("locator-repository");
    const locators = await locatorRepository
        .findByPublicationIdentifierAndLocatorType(
            publicationView.identifier,
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

    if (IS_DEV && _VSCODE_LAUNCH !== "true") {
        readerWindow.webContents.openDevTools({ mode: "detach" });
    }

    setMenu(readerWindow, true);

    return reader;
}

// type ActionType = Action<readerActions.ActionType.OpenRequest, readerActions.OpenActionPayload>;

export function* readerOpenRequestWatcher(): SagaIterator {
    while (true) {
        const action = yield* takeTyped(readerActions.openRequest.build);
        const publicationView = action.payload.publicationView;

        // Notify the streamer to create a manifest for this publication
        yield put(streamerActions.openPublication(
            publicationView,
        ));

        // Wait for the publication to be opened
        const streamerAction: Action<string, ActionPayloadStreamerPublicationOpenSuccess> = yield take([
            streamerActions.ActionType.PublicationOpenSuccess,
            streamerActions.ActionType.PublicationOpenError,
        ]);

        if (streamerAction.error) {
            // Failed to open publication
            // FIXME: Put publication in meta to be FSA compliant
            yield put({
                type: readerActions.ActionType.OpenError,
                payload: {
                    publicationView,
                },
            });
            continue;
        }

        const manifestUrl = streamerAction.payload.manifestUrl;
        const reader = yield* callTyped(
            () => openReader(publicationView, manifestUrl),
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
        const action: Action<string, CloseActionPayload> = yield take(readerActions.ActionType.CloseRequest);

        const reader = action.payload.reader;
        const gotoLibrary = action.payload.gotoLibrary;

        const closeFunction = closeReader.bind(closeReader, reader, gotoLibrary);
        yield call(closeFunction);
    }
}

export function* closeReaderFromPublicationWatcher(): SagaIterator {
    while (true) {
        // tslint:disable-next-line: max-line-length
        const action: Action<string, CloseReaderActionPayload> = yield take(readerActions.ActionType.CloseFromPublicationRequest);

        const publicationView = action.payload.publicationView;
        const store = diMainGet("store");
        const readers = (store.getState().reader as ReaderState).readers;

        for (const reader of Object.values(readers)) {
            if (reader.publicationView.identifier === publicationView.identifier) {
                const closeFunction = closeReader.bind(closeReader, reader, false);
                yield call(closeFunction);
            }
        }
    }
}

function* closeReader(reader: Reader, gotoLibrary: boolean) {
    const publicationView = reader.publicationView;

    // Notify the streamer that a publication has been closed
    yield put(streamerActions.closePublication(
        publicationView,
    ));

    // Wait for the publication to be closed
    const streamerAction: Action<string, ActionPayloadStreamerPublicationCloseSuccess> = yield take([
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
        return;
    }

    const winRegistry = diMainGet("win-registry");
    const readerWindow = winRegistry.getWindowByIdentifier(reader.identifier);

    if (gotoLibrary) {
        // Show library window
        const appWindows = winRegistry.getWindows();

        for (const appWin of Object.values(appWindows) as AppWindow[]) {
            if (appWin.type !== AppWindowType.Library) {
                continue;
            }
            // update window rectangle position
            yield call(async () => {
                appWin.win.setBounds(await getWindowsRectangle(AppWindowType.Library));
            });

            appWin.win.show();
        }
    }

    // Close directly reader window
    if (readerWindow && readerWindow.win) {
        readerWindow.win.close();
    }

    yield put({
        type: readerActions.ActionType.CloseSuccess,
        payload: {
            reader,
        },
    });
}

const READER_CONFIG_ID = "reader";
type ConfigDocumentType = ConfigDocument<ReaderConfig>;
type ConfigRepositoryType = BaseRepository<ConfigDocumentType>;
type ConfigDocumentTypeWithoutTimestampable = Omit<ConfigDocumentType, keyof Timestampable>;

export function* readerConfigSetRequestWatcher(): SagaIterator {
    while (true) {
        // Wait for save request
        const action: Action<string, SetConfigActionPayload> = yield take(readerActions.ActionType.ConfigSetRequest);

        const configValue: ReaderConfig = action.payload.config;
        const config: ConfigDocumentTypeWithoutTimestampable = {
            identifier: READER_CONFIG_ID,
            value: configValue,
        };

        // Get reader settings
        const configRepository: ConfigRepositoryType = diMainGet("config-repository");

        try {
            yield call(() => configRepository.save(config));
            yield put({
                type: readerActions.ActionType.ConfigSetSuccess,
                payload: {
                    config: configValue,
                },
            } as Action<string, ActionPayloadReaderMainConfigSetSuccess>);
        } catch (error) {
            yield put({ type: readerActions.ActionType.ConfigSetError, error: true });
        }
    }
}

export function* readerConfigInitWatcher(): SagaIterator {
    // Wait for app initialization
    yield take(appActions.ActionType.InitSuccess);

    const configRepository: ConfigRepositoryType = diMainGet("config-repository");

    try {
        const readerConfigDoc = yield* callTyped(() => configRepository.get(READER_CONFIG_ID));

        // Returns the first reader configuration available in database
        yield put({
            type: readerActions.ActionType.ConfigSetSuccess,
            payload: {
                config: readerConfigDoc.value,
            },
        } as Action<string, ActionPayloadReaderMainConfigSetSuccess>);
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
        // tslint:disable-next-line: max-line-length
        const action: Action<string, SaveBookmarkActionPayload> = yield take(readerActions.ActionType.BookmarkSaveRequest);

        const bookmark = action.payload.bookmark as Bookmark;

        // Get bookmark manager
        const locatorRepository = diMainGet("locator-repository");

        try {
            const locator = {
                // name: "",
                locator: {
                    href: bookmark.docHref,
                    locations: {
                        cssSelector: bookmark.docSelector,
                    },
                },
                publicationIdentifier: bookmark.identifiable.identifier,
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

export function* readerFullscreenRequestWatcher(): SagaIterator {
    while (true) {
        // Wait for app initialization
        const action: ActionWithSender = yield take([
            readerActions.ActionType.FullscreenOffRequest,
            readerActions.ActionType.FullscreenOnRequest,
        ]);

        const fullscreen = (action.type === readerActions.ActionType.FullscreenOnRequest);

        // Get browser window
        const sender = action.sender;
        const winRegistry = diMainGet("win-registry");
        const appWindow = winRegistry.getWindowByIdentifier(sender.winId);
        const browerWindow = appWindow.win as BrowserWindow;
        browerWindow.setFullScreen(fullscreen);
    }
}

export function* readerDetachRequestWatcher(): SagaIterator {
    while (true) {
        // Wait for a change mode request
        const action: Action<string, DetachActionPayload> = yield take(readerActions.ActionType.ModeSetRequest);

        const readerMode = action.payload.mode;
        const reader = action.payload.reader;

        if (readerMode === ReaderMode.Detached) {
            const winRegistry = diMainGet("win-registry");
            const readerWindow = winRegistry.getWindowByIdentifier(reader.identifier);

            const appWindows = winRegistry.getWindows();

            for (const appWin of Object.values(appWindows)) {
                if (appWin.type !== AppWindowType.Library) {
                    continue;
                }

                appWin.win.show();
            }
            readerWindow.onWindowMoveResize.detach();
            readerWindow.win.focus();
        }

        yield put({
            type: readerActions.ActionType.ModeSetSuccess,
            payload: {
                mode: readerMode,
            },
        } as Action<string, ActionPayloadReaderMainModeSetSuccess>);
    }
}

export function* watchers() {
    yield all([
        call(readerBookmarkSaveRequestWatcher),
        call(readerCloseRequestWatcher),
        call(readerConfigInitWatcher),
        call(readerConfigSetRequestWatcher),
        call(readerOpenRequestWatcher),
        call(readerFullscreenRequestWatcher),
        call(readerDetachRequestWatcher),
        call(closeReaderFromPublicationWatcher),
    ]);
}
