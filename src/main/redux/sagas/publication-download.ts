import "fs";

import { ipcMain } from "electron";
import { Buffer, buffers, channel, Channel, SagaIterator } from "redux-saga";
import { actionChannel, call, fork, put, select, take } from "redux-saga/effects";

import * as catalogActions from "readium-desktop/actions/catalog";

import { publicationDownloadActions } from "readium-desktop/common/redux/actions";

import { downloaderActions } from "readium-desktop/common/redux/actions";

import { Downloader } from "readium-desktop/main/services/downloader";

import { CustomCover, CustomCoverColors } from "readium-desktop/common/models/custom-cover";
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

function addPublicationToDb(publication: Publication, files?: File[]) {
    const publicationDb: PublicationDb = container.get(
            "publication-db") as PublicationDb;
    const db: PublicationDb = container.get("publication-db") as PublicationDb;
    const store = container.get("store") as Store<RootState>;

    let oldFiles: File[];

    if (files) {
        oldFiles = files;
    } else {
        oldFiles = publication.files;
    }

    let newPub: Publication = {
            title: publication.title,
            cover: publication.cover,
            download: publication.download,
            description: publication.description,
            identifier: publication.identifier,
            authors: publication.authors,
            languages: publication.languages,
        };
    // Extract cover
    let coverFile: File = null;
    let otherFiles: File[] = [];

    for (let file of oldFiles) {
        if (file.contentType.startsWith("image")) {
            coverFile = file;
        } else {
            otherFiles.push(file);
        }
    }

    if (coverFile !== null) {
        newPub.cover = coverFile;
    }
    newPub.files = otherFiles;

    if (coverFile === null && newPub.cover === null) {
        newPub.customCover = CreateCustomCover();
    }

    // Store publication metadata
    publicationDb
        .putOrChange(newPub)
        .then((result) => {
            db.getAll().then((publications) => {
                store.dispatch(
                    catalogActions.load(),
                );
            });
        })
        .catch((err) => {
            console.log(err);
        });
}

function CreateCustomCover(): CustomCover {
    return CustomCoverColors[Math.floor(Math.random() * CustomCoverColors.length)];
}

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
        const publicationStorage: PublicationStorage = container.get(
            "publication-storage") as PublicationStorage;

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
                yield put(publicationDownloadActions.finish(
                    publication,
                ));
                publicationStorage.storePublication(publication.identifier, download.dstPath).then((files) => {
                    addPublicationToDb(publication, files);
                });
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
