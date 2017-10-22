import { streamer } from "./../streamer";
import * as uuid from "uuid";

import { BrowserWindow, ipcMain } from "electron";

import { channel, Channel, SagaIterator } from "redux-saga";
import { call, fork, put, select, take } from "redux-saga/effects";

import * as readerActions from "readium-desktop/main/actions/reader";
import * as streamerActions from "readium-desktop/main/actions/streamer";

import { AppState } from "readium-desktop/main/reducers";

import { PublicationMessage } from "readium-desktop/models/ipc";
import { Publication } from "readium-desktop/models/publication";
import { Reader } from "readium-desktop/models/reader";

import { trackBrowserWindow } from "r2-streamer-js/dist/es6-es2015/src/electron/main/browser-window-tracker";

import {
    READER_OPEN_REQUEST,
} from "readium-desktop/events/ipc";

import {
    READER_CLOSE,
    READER_INIT,
    READER_OPEN,
} from "readium-desktop/main/actions/reader";
import {
    STREAMER_PUBLICATION_MANIFEST_OPEN,
} from "readium-desktop/main/actions/streamer";

import { encodeURIComponent_RFC3986 } from "readium-desktop/utils/url";

declare const __NODE_ENV__: string;

const READER_BASE_URL = `file://${__dirname}/../node_modules/r2-streamer-js/dist/es6-es2015/src/electron/renderer`;

function waitForReaderOpenRequest(chan: Channel<any>) {
    ipcMain.on(
        READER_OPEN_REQUEST,
        (event: any, msg: PublicationMessage) => {
            chan.put({
                renderer: event.sender,
                publication: msg.publication,
            });
        },
    );
}

function waitForReaderCloseEvent(
    chan: Channel<any>,
    reader: Reader,
) {
    reader.window.on("close", () => {
        chan.put(reader);
    });
}

function* openReader(publication: Publication): SagaIterator {
    const chan = yield call(channel);

    // Open a manifest for the given publication
    yield put(streamerActions.openPublication(publication));

    // Get the new initialize manifest url
    const action =  yield take(STREAMER_PUBLICATION_MANIFEST_OPEN);
    const manifestUrl = action.manifestUrl;

    // Create reader window
    let readerWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            allowRunningInsecureContent: false,
            contextIsolation: false,
            devTools: __NODE_ENV__ === "DEV",
            nodeIntegration: true,
            nodeIntegrationInWorker: false,
            sandbox: false,
            webSecurity: true,
            webviewTag: true,
        },
    });
    trackBrowserWindow(readerWindow);

    const reader: Reader = {
        identifier: uuid.v4(),
        publication,
        window: readerWindow,
    };

    const encodedManifestUrl = encodeURIComponent_RFC3986(manifestUrl);
    let readerUrl = `${READER_BASE_URL}/index.html?pub=${encodedManifestUrl}`;

    // Load url
    readerWindow.webContents.loadURL(readerUrl); // , { extraHeaders: "pragma: no-cache\n" }
    if (__NODE_ENV__ === "DEV") {
        readerWindow.webContents.openDevTools();
    }

    // Open reader
    yield put(readerActions.openReader(reader));

    // Listen for reader close event
    yield fork(
        waitForReaderCloseEvent,
        chan,
        reader,
    );

    yield take(chan);

    // Close reader
    yield put(readerActions.closeReader(reader));
}

export function* watchReaderOpenRequest(): SagaIterator {
    const chan = yield call(channel);

    yield fork(waitForReaderOpenRequest, chan);

    while (true) {
        const ipcWaitResponse: any = yield take(chan);
        yield fork(openReader, ipcWaitResponse.publication);

        // Get epub file from publication
        // const pubStorage: PublicationStorage = container.get("publication-storage") as PublicationStorage;
        // const epubPath = path.join(
        //     pubStorage.getRootPath(),
        //     publication.files[0].url.substr(6),
        // );

    }
}

export function* watchReaderInit(): SagaIterator {
    while (true) {
        const action = yield take(READER_INIT);
        console.log(action);
    }
}

export function* watchReaderOpen(): SagaIterator {
    while (true) {
        const action = yield take(READER_OPEN);
        console.log("Reader open");
    }
}

export function* watchReaderClose(): SagaIterator {
    while (true) {
        const action = yield take(READER_CLOSE);

        // Notify the streamer that a publication has been closed
        yield put(streamerActions.closePublication(
            action.reader.publication,
        ));
        console.log("Reader close");
    }
}
