import { ipcMain } from "electron";
import { channel, Channel, SagaIterator } from "redux-saga";
import { call, fork, put, take } from "redux-saga/effects";

import {
    addPublicationDownload,
    PUBLICATION_DOWNLOAD_ADD,
    PUBLICATION_DOWNLOAD_FINISH,
    PUBLICATION_DOWNLOAD_PROGRESS,
    PublicationAction,
} from "readium-desktop/actions/catalog";

import { Download } from "readium-desktop/downloader/download";
import { Downloader } from "readium-desktop/downloader/downloader";
import {
    PUBLICATION_DOWNLOAD_REQUEST,
} from "readium-desktop/events/ipc";
import { Error } from "readium-desktop/models/error";
import { PublicationMessage } from "readium-desktop/models/ipc";
import { Publication } from "readium-desktop/models/publication";

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

export function* watchPublicationDownloadStart(): SagaIterator {
    while (true) {
        const publicationAction: PublicationAction = yield take(PUBLICATION_DOWNLOAD_ADD);
        const publication = publicationAction.publication;
        const downloader: Downloader = container.get("downloader") as Downloader;

        let epubType = "application/epub+zip";
        let url: string;
        let download: Download;

        for (let file of publication.files) {
            if (file.contentType === epubType) {
                url = file.url;
            }
        }
        if (url) {
            download = downloader.download(url);
        }
    }
}

export function* watchPublicationDownloadProgress(): SagaIterator {
    while (true) {
        yield take(PUBLICATION_DOWNLOAD_PROGRESS);
    }
}

export function* watchPublicationDownloadFinish(): SagaIterator {
    while (true) {
        yield take(PUBLICATION_DOWNLOAD_FINISH);
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
        yield put(addPublicationDownload(publicationResponse.publication));
    }
}
