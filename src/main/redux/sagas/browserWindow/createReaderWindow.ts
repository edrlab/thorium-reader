import { BrowserWindow, Menu } from "electron";
import * as path from "path";
import {
    convertHttpUrlToCustomScheme,
} from "r2-navigator-js/dist/es6-es2015/src/electron/common/sessions";
import {
    trackBrowserWindow,
} from "r2-navigator-js/dist/es6-es2015/src/electron/main/browser-window-tracker";
import { LocatorType } from "readium-desktop/common/models/locator";
import { Reader } from "readium-desktop/common/models/reader";
import { AppWindowType } from "readium-desktop/common/models/win";
import { selectTyped } from "readium-desktop/common/redux/typed-saga";
import { diMainGet } from "readium-desktop/main/di";
import { setMenu } from "readium-desktop/main/menu";
import {
    _RENDERER_READER_BASE_URL, _VSCODE_LAUNCH, IS_DEV,
} from "readium-desktop/preprocessor-directives";

import { encodeURIComponent_RFC3986 } from "@r2-utils-js/_utils/http/UrlUtils";

import { RootState } from "../../states";
import { defaultRectangle } from "readium-desktop/common/rectangle/window";
import { winActions } from "../../actions";
import { readerActions } from "readium-desktop/common/redux/actions";

// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

function* createReaderWindow(publicationIdentifier: string, manifestUrl: string) {

    const readers = yield* selectTyped(
        (state: RootState) => state.win.registry.reader,
    );

    const library = yield* selectTyped(
        (state: RootState) => state.win.registry.library,
    );

    const reader = readers.find((_reader) => _reader.publicationIdentifier === publicationIdentifier);

    let windowBound;
    if (reader) {
        windowBound = reader.windowBound;
    } else {
        windowBound = library.windowBound;
    }

    const readerWindow = new BrowserWindow({
        ...windowBound,
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

    readerWindow.webContents.on("did-finish-load",
        () =>
            diMainGet("store").dispatch(winActions.registry.registerReader.build(readerWindow, publicationIdentifier)),
    );

    readerWindow.on("closed",
        () =>
            diMainGet("store").dispatch(winActions.registry.unregisterReader.build()),
    );

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

/*
    should be removed replaced with redux preloaded state
    no query url  be needed only redux state

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
        const docSelector =
            encodeURIComponent_RFC3986(Buffer.from(locator.locator.locations.cssSelector).toString("base64"));
        readerUrl += `&docHref=${docHref}&docSelector=${docSelector}`;
    }
*/

    readerWindow.webContents.loadURL(readerUrl, { extraHeaders: "pragma: no-cache\n" });

    if (IS_DEV && _VSCODE_LAUNCH !== "true") {
        readerWindow.webContents.openDevTools({ mode: "detach" });
    }

    setMenu(readerWindow, true);

    // TODO should be updated:

    // Publication is opened in a new reader
    yield put(readerActions.openSuccess.build(readerWindow));
}
