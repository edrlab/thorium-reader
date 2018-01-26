import * as uuid from "uuid";
import * as path from "path";

import { BrowserWindow, ipcMain, webContents } from "electron";

import { channel, Channel, SagaIterator } from "redux-saga";
import { call, fork, put, select, take } from "redux-saga/effects";

import * as readerActions from "readium-desktop/main/actions/reader";
import * as streamerActions from "readium-desktop/main/actions/streamer";

import { AppState } from "readium-desktop/main/reducers";

import { PublicationMessage } from "readium-desktop/models/ipc";
import { Publication } from "readium-desktop/models/publication";
import { Reader } from "readium-desktop/models/reader";

import { Publication as StreamerPublication } from "@r2-shared-js/models/publication";
import { trackBrowserWindow } from "@r2-navigator-js/electron/main/browser-window-tracker";

import { launchStatusDocumentProcessing } from "@r2-lcp-js/lsd/status-document-processing";
import { deviceIDManager } from "@r2-testapp-js/electron/main/lsd-deviceid-manager";
import { lsdLcpUpdateInject } from "@r2-navigator-js/electron/main/lsd-injectlcpl";

import { container } from "readium-desktop/main/di";

import { Server } from "@r2-streamer-js/http/server";

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

import { encodeURIComponent_RFC3986 } from "@r2-utils-js/_utils/http/UrlUtils";
// import { encodeURIComponent_RFC3986 } from "readium-desktop/utils/url";

import { PublicationStorage } from "readium-desktop/main/storage/publication-storage";

// Preprocessing directive
declare const __RENDERER_BASE_URL__: string;
declare const __NODE_ENV__: string;
declare const __NODE_MODULE_RELATIVE_URL__: string;
declare const __PACKAGING__: string;

const IS_DEV =  __NODE_ENV__ === "DEV" ||
    __PACKAGING__ === "0" && (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");

function openAllDevTools() {
    for (const wc of webContents.getAllWebContents()) {
        // if (wc.hostWebContents &&
        //     wc.hostWebContents.id === electronBrowserWindow.webContents.id) {
        // }
        wc.openDevTools();
    }
}

// function openTopLevelDevTools() {
//     const bw = BrowserWindow.getFocusedWindow();
//     if (bw) {
//         bw.webContents.openDevTools();
//     } else {
//         const arr = BrowserWindow.getAllWindows();
//         arr.forEach((bww) => {
//             bww.webContents.openDevTools();
//         });
//     }
// }

interface IReaderOpenRequest {
    renderer: any;
    publication: Publication;
}

function waitForReaderOpenRequest(chan: Channel<IReaderOpenRequest>) {
    ipcMain.on(
        READER_OPEN_REQUEST,
        (event: any, msg: PublicationMessage) => {
            const obj: IReaderOpenRequest = {
                renderer: event.sender,
                publication: msg.publication,
            };
            chan.put(obj);
        },
    );
}

function waitForReaderCloseEvent(
    chan: Channel<Reader>,
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
    const manifestUrl = (action as streamerActions.StreamerAction).manifestUrl;
    if ((action as streamerActions.StreamerAction).publication !== publication) {
        console.log("StreamerAction.publication != IPC.publication ?");
    }

    // Create reader window
    let readerWindow = new BrowserWindow({
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
    trackBrowserWindow(readerWindow);

    const pathBase64 = manifestUrl.replace(/.*\/pub\/(.*)\/manifest.json/, "$1");
    const pathDecoded = new Buffer(pathBase64, "base64").toString("utf8");

    const pubStorage: PublicationStorage = container.get("publication-storage") as PublicationStorage;
    // const epubPath = path.join(
    //     pubStorage.getRootPath(),
    //     publication.files[0].url.replace("store://", "");
    // );
    console.log(pubStorage.getRootPath() + " +++ " + publication.files[0].url + " ===> " + pathDecoded);

    const reader: Reader = {
        identifier: uuid.v4(),
        publication,
        manifestUrl,
        filesystemPath: pathDecoded,
        window: readerWindow,
    };

    // tslint:disable-next-line:no-floating-promises
    (async () => {
        const streamer: Server = container.get("streamer") as Server;

        let streamerPublication: StreamerPublication | undefined;
        try {
            streamerPublication = await streamer.loadOrGetCachedPublication(pathDecoded);
        } catch (err) {
            console.log(err);
        }
        let lcpHint: string | undefined;
        if (streamerPublication && streamerPublication.LCP) {
            try {
                await launchStatusDocumentProcessing(streamerPublication.LCP, deviceIDManager,
                    async (licenseUpdateJson: string | undefined) => {
                        console.log("launchStatusDocumentProcessing DONE.");

                    if (licenseUpdateJson) {
                        let res: string;
                        try {
                            res = await lsdLcpUpdateInject(licenseUpdateJson, streamerPublication, pathDecoded);
                            console.log("EPUB SAVED: " + res);
                        } catch (err) {
                            console.log(err);
                        }
                    }
                });
            } catch (err) {
                console.log(err);
            }
            if (streamerPublication.LCP.Encryption &&
                streamerPublication.LCP.Encryption.UserKey &&
                streamerPublication.LCP.Encryption.UserKey.TextHint) {
                lcpHint = streamerPublication.LCP.Encryption.UserKey.TextHint;
            }
            if (!lcpHint) {
                lcpHint = "LCP passphrase";
            }
        }

        const encodedManifestUrl = encodeURIComponent_RFC3986(manifestUrl);

        let readerUrl = __RENDERER_BASE_URL__;

        if (__PACKAGING__ === "0" && process.env.R2 === "new") {
            const htmlPath = "index_reader.html";

            if (readerUrl === "file://") {
                // dist/prod mode (without WebPack HMR Hot Module Reload HTTP server)
                readerUrl += path.normalize(path.join(__dirname, htmlPath));
            } else {
                // dev/debug mode (with WebPack HMR Hot Module Reload HTTP server)
                readerUrl = readerUrl.replace(":8080", ":8081");
                readerUrl += htmlPath;
            }
        } else {
            readerUrl = "file://" + path.normalize(path.join(__dirname, __NODE_MODULE_RELATIVE_URL__,
                "r2-testapp-js", "dist", "es6-es2015", "src", "electron", "renderer", "index.html"));
        }

        readerUrl = readerUrl.replace(/\\/g, "/");

        readerUrl += `?pub=${encodedManifestUrl}`;

        if (lcpHint) {
            readerUrl += "&lcpHint=" + encodeURIComponent_RFC3986(lcpHint);
        }

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
            }, 8000); // TODO: needs smarter method!
        }
    })();

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
        const ipcWaitResponse: IReaderOpenRequest = yield take(chan);
        yield fork(openReader, ipcWaitResponse.publication);
    }
}

// export function* watchReaderInit(): SagaIterator {
//     while (true) {
//         const action = yield take(READER_INIT);
//         console.log("Reader init (MAIN)");
//         console.log(action as readerActions.ReaderAction);
//     }
// }

export function* watchReaderOpen(): SagaIterator {
    while (true) {
        const action = yield take(READER_OPEN);
        console.log("Reader open (MAIN)");
        console.log(action as readerActions.ReaderAction);
    }
}

export function* watchReaderClose(): SagaIterator {
    while (true) {
        const action = yield take(READER_CLOSE);
        console.log("Reader close (MAIN)");
        console.log(action as readerActions.ReaderAction);

        // Notify the streamer that a publication has been closed
        yield put(streamerActions.closePublication(
            (action as readerActions.ReaderAction).reader.publication,
        ));
    }
}
