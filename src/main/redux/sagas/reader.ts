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
import { Reader, ReaderConfig, ReaderMode } from "readium-desktop/common/models/reader";
import { Timestampable } from "readium-desktop/common/models/timestampable";
import { AppWindowType } from "readium-desktop/common/models/win";
import { getWindowBounds } from "readium-desktop/common/rectangle/window";
import { readerActions } from "readium-desktop/common/redux/actions";
import { callTyped, selectTyped, takeTyped } from "readium-desktop/common/redux/typed-saga";
import { ConfigDocument } from "readium-desktop/main/db/document/config";
import { ConfigRepository } from "readium-desktop/main/db/repository/config";
import { diMainGet } from "readium-desktop/main/di";
import { setMenu } from "readium-desktop/main/menu";
import { appActions, streamerActions } from "readium-desktop/main/redux/actions";
import { RootState } from "readium-desktop/main/redux/states";
import {
    _NODE_MODULE_RELATIVE_URL, _PACKAGING, _RENDERER_READER_BASE_URL, _VSCODE_LAUNCH, IS_DEV,
} from "readium-desktop/preprocessor-directives";
import { SagaIterator } from "redux-saga";
import { all, call, put, take } from "redux-saga/effects";

import { convertHttpUrlToCustomScheme } from "@r2-navigator-js/electron/common/sessions";
import { trackBrowserWindow } from "@r2-navigator-js/electron/main/browser-window-tracker";
import { encodeURIComponent_RFC3986 } from "@r2-utils-js/_utils/http/UrlUtils";

// Logger
const debug = debug_("readium-desktop:main:redux:sagas:reader");

async function openReader(publicationIdentifier: string, manifestUrl: string) {
    debug("create readerWindow");
    // Create reader window
    const readerWindow = new BrowserWindow({
        ...(await getWindowBounds()),
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

        // Already done for primary library BrowserWindow
        // readerWindow.webContents.on("did-finish-load", () => {
        //     const {
        //         default: installExtension,
        //         REACT_DEVELOPER_TOOLS,
        //         REDUX_DEVTOOLS,
        //     } = require("electron-devtools-installer");

        //     [REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS].forEach((extension) => {
        //         installExtension(extension)
        //             .then((name: string) => debug("Added Extension: ", name))
        //             .catch((err: Error) => debug("An error occurred: ", err));
        //     });
        // });

        if (_VSCODE_LAUNCH !== "true") {
            setTimeout(() => {
                readerWindow.webContents.openDevTools({ mode: "detach" });
            }, 2000);
        }
    }

    const winRegistry = diMainGet("win-registry");
    const appWindows = winRegistry.getAllWindows();

    const thereIsOnlyTheLibraryWindow = appWindows.length === 1;

    // Hide the only window (the library),
    // as the new reader window will now take over
    // (in other words: "detach" mode is disabled by default for new reader windows)
    if (thereIsOnlyTheLibraryWindow) {
        // Same as: appWindows[0]
        const libraryAppWindow = winRegistry.getLibraryWindow();
        if (libraryAppWindow) {
            libraryAppWindow.browserWindow.hide();
        }
    }

    const readerAppWindow = winRegistry.registerWindow(
        readerWindow,
        AppWindowType.Reader,
        );

    if (thereIsOnlyTheLibraryWindow) {
        // onWindowMoveResize.detach() is called for reader windows that become ReaderMode.Detached
        // (in which case the library window is shown again, and then its position takes precedence)
        readerAppWindow.onWindowMoveResize.attach();
    }

    // Track it
    trackBrowserWindow(readerWindow);

    const pathBase64 = manifestUrl.replace(/.*\/pub\/(.*)\/manifest.json/, "$1");
    const pathDecoded = Buffer.from(decodeURIComponent(pathBase64), "base64").toString("utf8");

    // Create reader object
    const reader: Reader = {
        identifier: readerAppWindow.identifier,
        publicationIdentifier,
        manifestUrl,
        filesystemPath: pathDecoded,
        browserWindow: readerWindow,
        browserWindowID: readerWindow.id,
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
    readerUrl += `?pub=${encodedManifestUrl}&pubId=${publicationIdentifier}`;

    // Get publication last reading location
    const locatorRepository = diMainGet("locator-repository");
    const locators = await locatorRepository
        .findByPublicationIdentifierAndLocatorType(
            publicationIdentifier,
            LocatorType.LastReadingLocation,
        );

    if (locators.length > 0) {
        const locator = locators[0];
        const docHref = encodeURIComponent_RFC3986(Buffer.from(locator.locator.href).toString("base64"));
        const docSelector = locator.locator.locations.cssSelector
            ? encodeURIComponent_RFC3986(Buffer.from(locator.locator.locations.cssSelector).toString("base64"))
            : undefined;
        const docProgression = locator.locator.locations.progression
            // tslint:disable-next-line: max-line-length
            ? encodeURIComponent_RFC3986(Buffer.from(locator.locator.locations.progression.toString()).toString("base64"))
            : undefined;
        readerUrl += `&docHref=${docHref}&docSelector=${docSelector}&docProgression=${docProgression}`;
    }

    setMenu(readerWindow, true);

    process.nextTick(async () => {
        await readerWindow.webContents.loadURL(readerUrl, { extraHeaders: "pragma: no-cache\n" });
    });

    return reader;
}

export function* readerOpenRequestWatcher(): SagaIterator {
    while (true) {
        const action = yield* takeTyped(readerActions.openRequest.build);
        const publicationIdentifier = action.payload.publicationIdentifier;

        // Notify the streamer to create a manifest for this publication
        yield put(streamerActions.publicationOpenRequest.build(publicationIdentifier));

        // Wait for the publication to be opened
        const streamerAction = yield take([
            streamerActions.publicationOpenSuccess.ID,
            streamerActions.publicationOpenError.ID,
        ]);
        const typedAction = streamerAction.error ?
            streamerAction as streamerActions.publicationOpenError.TAction :
            streamerAction as streamerActions.publicationOpenSuccess.TAction;

        if (typedAction.error) {
            // Failed to open publication
            // FIXME: Put publication in meta to be FSA compliant
            yield put(readerActions.openError.build(publicationIdentifier));
            continue;
        }

        const manifestUrl = typedAction.payload.manifestUrl;
        const reader = yield* callTyped(
            () => openReader(publicationIdentifier, manifestUrl),
        );

        // Publication is opened in a new reader
        yield put(readerActions.openSuccess.build(reader));
    }
}

export function* readerCloseRequestWatcher(): SagaIterator {
    while (true) {
        const action = yield* takeTyped(readerActions.closeRequest.build);

        const reader = action.payload.reader;
        const gotoLibrary = action.payload.gotoLibrary;

        yield call(() => closeReader(reader, gotoLibrary));
    }
}

export function* closeReaderFromPublicationWatcher(): SagaIterator {
    while (true) {
        // tslint:disable-next-line: max-line-length
        const action = yield* takeTyped(readerActions.closeRequestFromPublication.build);

        const publicationIdentifier = action.payload.publicationIdentifier;

        const readers = yield* selectTyped((s: RootState) => s.reader.readers);

        for (const reader of Object.values(readers)) {
            if (reader.publicationIdentifier === publicationIdentifier) {
                yield call(() => closeReader(reader, false));
            }
        }
    }
}

function* closeReader(reader: Reader, gotoLibrary: boolean) {
    const publicationIdentifier = reader.publicationIdentifier;

    // Notify the streamer that a publication has been closed
    yield put(streamerActions.publicationCloseRequest.build(publicationIdentifier));

    // Wait for the publication to be closed
    const streamerAction = yield take([
        streamerActions.publicationCloseSuccess.ID,
        streamerActions.publicationCloseError.ID,
    ]);
    const typedAction = streamerAction.error ?
        streamerAction as streamerActions.publicationCloseError.TAction :
        streamerAction as streamerActions.publicationCloseSuccess.TAction;

    if (typedAction.error) {
        // Failed to close publication
        yield put(readerActions.closeError.build(reader));
        return;
    }

    const winRegistry = diMainGet("win-registry");

    if (gotoLibrary) {
        const libraryAppWindow = winRegistry.getLibraryWindow();
        if (libraryAppWindow) {
            yield call(async () => {
                libraryAppWindow.browserWindow.setBounds(await getWindowBounds(AppWindowType.Library));
            });
            if (libraryAppWindow.browserWindow.isMinimized()) {
                libraryAppWindow.browserWindow.restore();
            }
            libraryAppWindow.browserWindow.show(); // focuses as well
        }
    }

    const readerWindow = winRegistry.getWindowByIdentifier(reader.identifier);
    if (readerWindow) {
        readerWindow.browserWindow.close();
    }

    yield put(readerActions.closeSuccess.build(reader));
}

const READER_CONFIG_ID = "reader";

export function* readerConfigSetRequestWatcher(): SagaIterator {
    while (true) {
        // Wait for save request
        const action = yield* takeTyped(readerActions.configSetRequest.build);

        const configValue = action.payload.config;
        const config: Omit<ConfigDocument<ReaderConfig>, keyof Timestampable> = {
            identifier: READER_CONFIG_ID,
            value: configValue,
        };

        // Get reader settings
        const configRepository: ConfigRepository<ReaderConfig> = diMainGet("config-repository");

        try {
            yield call(() => configRepository.save(config));
            yield put(readerActions.configSetSuccess.build(configValue));
        } catch (error) {
            yield put(readerActions.configSetError.build(error));
        }
    }
}

export function* readerConfigInitWatcher(): SagaIterator {
    // Wait for app initialization
    yield take(appActions.initSuccess.ID);

    const configRepository: ConfigRepository<ReaderConfig> = diMainGet("config-repository");

    try {
        const readerConfigDoc = yield* callTyped(() => configRepository.get(READER_CONFIG_ID));

        // Returns the first reader configuration available in database
        yield put(readerActions.configSetSuccess.build(readerConfigDoc.value));
    } catch (error) {
        yield put(readerActions.configSetError.build(error));
    }
}

// export function* readerBookmarkSaveRequestWatcher(): SagaIterator {
//     while (true) {
//         // Wait for app initialization
//         // tslint:disable-next-line: max-line-length
//         const action = yield* takeTyped(readerActions.saveBookmarkRequest.build);

//         const bookmark = action.payload.bookmark;

//         // Get bookmark manager
//         const locatorRepository = diMainGet("locator-repository");

//         try {
//             const locator: ExcludeTimestampableWithPartialIdentifiable<LocatorDocument> = {
//                 // name: "",
//                 locator: {
//                     href: bookmark.docHref,
//                     locations: {
//                         cssSelector: bookmark.docSelector,
//                     },
//                 },
//                 publicationIdentifier: bookmark.publicationIdentifier,
//                 locatorType: LocatorType.LastReadingLocation,
//             };
//             yield call(() => locatorRepository.save(locator));
//             yield put(readerActions.saveBookmarkSuccess.build(bookmark));
//         } catch (error) {
//             yield put(readerActions.saveBookmarkError.build(error));
//         }
//     }
// }

export function* readerFullscreenRequestWatcher(): SagaIterator {
    while (true) {
        // Wait for app initialization
        const action = yield* takeTyped(readerActions.fullScreenRequest.build);

        // Get browser window
        const sender = action.sender;

        const winRegistry = diMainGet("win-registry");
        const appWindow = winRegistry.getWindowByIdentifier(sender.winId);
        if (appWindow) {
            appWindow.browserWindow.setFullScreen(action.payload.full);
        }
    }
}

export function* readerDetachRequestWatcher(): SagaIterator {
    while (true) {
        // Wait for a change mode request
        const action = yield* takeTyped(readerActions.detachModeRequest.build);

        const readerMode = action.payload.mode;
        const reader = action.payload.reader;

        if (readerMode === ReaderMode.Detached) {
            const winRegistry = diMainGet("win-registry");

            const libraryAppWindow = winRegistry.getLibraryWindow();
            if (libraryAppWindow) {
                // this should never occur, but let's do it for certainty
                if (libraryAppWindow.browserWindow.isMinimized()) {
                    libraryAppWindow.browserWindow.restore();
                }
                libraryAppWindow.browserWindow.show(); // focuses as well
            }

            const readerWindow = winRegistry.getWindowByIdentifier(reader.identifier);
            if (readerWindow) {
                readerWindow.onWindowMoveResize.detach();

                // this should never occur, but let's do it for certainty
                if (readerWindow.browserWindow.isMinimized()) {
                    readerWindow.browserWindow.restore();
                }
                readerWindow.browserWindow.show(); // focuses as well
            }
        }

        yield put(readerActions.detachModeSuccess.build(readerMode));
    }
}

export function* watchers() {
    yield all([
        // call(readerBookmarkSaveRequestWatcher),
        call(readerCloseRequestWatcher),
        call(readerConfigInitWatcher),
        call(readerConfigSetRequestWatcher),
        call(readerOpenRequestWatcher),
        call(readerFullscreenRequestWatcher),
        call(readerDetachRequestWatcher),
        call(closeReaderFromPublicationWatcher),
    ]);
}
