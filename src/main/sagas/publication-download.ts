import { ipcMain } from "electron";
import { Buffer, buffers, channel, Channel, SagaIterator } from "redux-saga";
import { actionChannel, call, fork, put, select, take } from "redux-saga/effects";

import {
    PUBLICATION_DOWNLOAD_ADD,
    PUBLICATION_DOWNLOAD_FINISH,
    PUBLICATION_DOWNLOAD_PROGRESS,
    PUBLICATION_DOWNLOAD_START,
    PublicationDownloadAction,
} from "readium-desktop/actions/publication-download";

import * as catalogActions from "readium-desktop/actions/catalog";

import * as publicationDownloadActions
from "readium-desktop/actions/publication-download";

import { DownloadAction } from "readium-desktop/actions/downloader";

import {
    DOWNLOAD_FINISH,
    DOWNLOAD_PROGRESS,
} from "readium-desktop/downloader/constants";

import { Downloader } from "readium-desktop/downloader/downloader";
import {
    PUBLICATION_DOWNLOAD_REQUEST,
} from "readium-desktop/events/ipc";

import { Download } from "readium-desktop/models/download";
import { DownloadStatus } from "readium-desktop/models/downloadable";
import { Error } from "readium-desktop/models/error";
import { Publication } from "readium-desktop/models/publication";

import { PublicationMessage } from "readium-desktop/models/ipc";

import { AppState } from "readium-desktop/main/reducers";

import { container } from "readium-desktop/main/di";

enum PublicationResponseType {
    Error, // Response implements Error interface
    Catalog, // Response implements Catalog interface
}

interface PublicationResponse {
    type: PublicationResponseType;
    publication?: Publication;
    error?: Error;
}

function *startPublicationDownload(publication: Publication): SagaIterator {
    const downloader: Downloader = container.get("downloader") as Downloader;
    const epubType = "application/epub+zip";
    let downloads: Download[] = [];

    for (let file of publication.files) {
        if (file.contentType !== epubType) {
            continue;
        }
        const download = downloader.download(file.url);
        downloads.push(download);
    }

    yield put(publicationDownloadActions.start(publication, downloads));
}

function* updatePublication(publication: Publication) {
    yield put(catalogActions.updatePublication(
            publication,
    ));
}

export function* watchPublicationDownloadUpdate(): SagaIterator {
    let buffer: Buffer<any> = buffers.expanding(20);
    let chan = yield actionChannel([
            PUBLICATION_DOWNLOAD_ADD,
            PUBLICATION_DOWNLOAD_START,
            PUBLICATION_DOWNLOAD_FINISH,
            PUBLICATION_DOWNLOAD_PROGRESS,
        ], buffer);
    while (true) {
        const action: PublicationDownloadAction = yield take(chan);

        const publication = action.publication;

        switch (action.type) {
            case PUBLICATION_DOWNLOAD_ADD:
            console.log("### add");
                publication.download = {
                    progress: 0,
                    status: DownloadStatus.Init,
                };
                yield fork(startPublicationDownload, publication);
                break;
            case PUBLICATION_DOWNLOAD_START:
            console.log("### start");
                publication.download = {
                    progress: 0,
                    status: DownloadStatus.Downloading,
                };
                break;
            case PUBLICATION_DOWNLOAD_PROGRESS:

            console.log("### progress");
                publication.download = {
                    progress: action.progress,
                    status: DownloadStatus.Downloading,
                };
                break;
            case PUBLICATION_DOWNLOAD_FINISH:
            console.log("### finish");
                publication.download = {
                    progress: 100,
                    status: DownloadStatus.Downloaded,
                };
                break;
            default:
                break;
        }

        yield fork(updatePublication, publication);
    }
}

export function* watchDownloadUpdate(): SagaIterator {
    while (true) {
        const action: DownloadAction = yield take([
            DOWNLOAD_FINISH,
            DOWNLOAD_PROGRESS,
        ]);

        const state: AppState = yield select();

        // Find publication linked to this download
        const download = action.download;
        const publicationIdentifier = state.publicationDownloads.downloadToPublication[download.identifier];

        // Retrieve publication from catalog
        let publication: Publication = undefined;
        const publications: Publication[] = state.catalog.publications;

        for (let pub of publications) {
            if (pub.identifier ===  publicationIdentifier) {
                publication = pub;
                break;
            }
        }

        // FIXME: A publication is composed of multiple downloads
        const progress = download.progress;

        switch (action.type) {
            case DOWNLOAD_PROGRESS:
                yield put(publicationDownloadActions.progress(
                    publication,
                    progress,
                ));
                break;
            case DOWNLOAD_FINISH:
                yield put(publicationDownloadActions.finish(
                    publication,
                ));
                break;
            default:
                break;
        }
    }
}

function waitForPublicationDownloadRequest(chan: Channel<any>) {
    // Wait for catalog request from a renderer process
    ipcMain.on(
        PUBLICATION_DOWNLOAD_REQUEST,
        (event: any, msg: PublicationMessage) => {
            chan.put({
                type: PublicationResponseType,
                publication: msg.publication,
            });
        },
    );
}

export function* watchRendererPublicationDownloadRequest(): SagaIterator {
    while (true) {
        const chan = yield call(channel);
        yield fork(waitForPublicationDownloadRequest, chan);
        const publicationResponse: PublicationResponse = yield take(chan);
        yield put(publicationDownloadActions.add(publicationResponse.publication));
    }
}
