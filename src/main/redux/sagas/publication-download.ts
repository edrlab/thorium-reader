import "fs";

import { ipcMain } from "electron";
import { Buffer, buffers, channel, Channel, SagaIterator } from "redux-saga";
import { actionChannel, call, fork, put, select, take } from "redux-saga/effects";

import {
    catalogActions,
    downloaderActions,
    publicationDownloadActions,
} from "readium-desktop/common/redux/actions";

import { CatalogService } from "readium-desktop/main/services/catalog";
import { Downloader } from "readium-desktop/main/services/downloader";

import { Download } from "readium-desktop/common/models/download";
import { DownloadStatus } from "readium-desktop/common/models/downloadable";
import { Error } from "readium-desktop/common/models/error";
import { Publication } from "readium-desktop/common/models/publication";

import { PublicationMessage } from "readium-desktop/common/models/ipc";

import { RootState } from "readium-desktop/main/redux/states";

import { container } from "readium-desktop/main/di";

import { PublicationStorage } from "readium-desktop/main/storage/publication-storage";

import { File } from "readium-desktop/common/models/file";

import { PublicationDb } from "readium-desktop/main/db/publication-db";

import { Store } from "redux";

export function* publicationDownloadStatusWatcher(): SagaIterator {
    while (true) {
        const action = yield take([
            downloaderActions.ActionType.Success,
            downloaderActions.ActionType.Progress,
        ]);

        const state: RootState = yield select();

        // Find publication linked to this download
        const download = action.payload.download;
        const publication = state.publicationDownloads
            .downloadIdentifierToPublication[download.identifier];
        const catalogService = container.get(
            "catalog-service") as CatalogService;

        switch (action.type) {
            case downloaderActions.ActionType.Progress:
                // FIXME: A publication is composed of multiple downloads
                const progress = action.payload.progress;
                yield put(publicationDownloadActions.progress(
                    publication,
                    progress,
                ));
                break;
            case downloaderActions.ActionType.Success:
                try {
                    const storedPub = yield call(() => catalogService.addPublicationFromLocalPath(
                        publication,
                        download.dstPath,
                    ));
                    yield put(publicationDownloadActions.finish(
                        storedPub,
                    ));
                } catch (error) {
                    yield put({
                        type: publicationDownloadActions.ActionType.Error,
                        error: true,
                        payload: new Error(error),
                        meta: {
                            publication,
                        },
                    });
                }
                break;
            default:
                break;
        }
    }
}

export function* publicationDownloadCancelRequestWatcher(): SagaIterator {
    while (true) {
        const action = yield take(
            publicationDownloadActions.ActionType.CancelRequest,
        );

        const publication = action.payload.publication;
        const downloader: Downloader = container.get("downloader") as Downloader;

        const state: RootState =  yield select();
        const downloads = state
            .publicationDownloads
                .publicationIdentifierToDownloads[publication.identifier];

        // Cancel each downloads linked to this publication
        for (const download of downloads) {
            yield put(downloaderActions.cancel(download));
        }

        yield put(
            {
                type: publicationDownloadActions.ActionType.CancelSuccess,
                payload: {
                    publication,
                },
            },
        );
    }
}

export function* publicationDownloadAddRequestWatcher(): SagaIterator {
    while (true) {
        const action = yield take(
            publicationDownloadActions.ActionType.AddRequest,
        );
        const publication = action.payload.publication;
        const downloader: Downloader = container.get("downloader") as Downloader;
        const epubType = "application/epub+zip";

        const downloads: Download[] = [];

        for (const file of publication.files) {
            if (file.contentType !== epubType) {
                continue;
            }
            const download = downloader.download(file.url);
            downloads.push(download);
        }

        yield put(publicationDownloadActions.start(publication, downloads));
    }
}
