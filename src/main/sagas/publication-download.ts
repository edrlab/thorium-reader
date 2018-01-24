import "fs";

import { ipcMain } from "electron";
import { Buffer, buffers, channel, Channel, SagaIterator } from "redux-saga";
import { actionChannel, call, fork, put, select, take } from "redux-saga/effects";

import {
    PUBLICATION_DOWNLOAD_ADD,
    PUBLICATION_DOWNLOAD_CANCEL,
    PUBLICATION_DOWNLOAD_FINISH,
    PUBLICATION_DOWNLOAD_PROGRESS,
    PUBLICATION_DOWNLOAD_START,
    PublicationDownloadAction,
} from "readium-desktop/actions/publication-download";

import * as catalogActions from "readium-desktop/actions/catalog";

import * as DownloaderAction from "readium-desktop/actions/downloader";
import * as publicationDownloadActions
from "readium-desktop/actions/publication-download";

import { DownloadAction } from "readium-desktop/actions/downloader";

import {
    DOWNLOAD_FINISH,
    DOWNLOAD_PROGRESS,
} from "readium-desktop/downloader/constants";

import { Downloader } from "readium-desktop/downloader/downloader";
import {
    PUBLICATION_DOWNLOAD_CANCEL_REQUEST,
    PUBLICATION_DOWNLOAD_REQUEST,
} from "readium-desktop/events/ipc";

import { CustomCover, CustomCoverColors } from "readium-desktop/models/custom-cover";
import { Download } from "readium-desktop/models/download";
import { DownloadStatus } from "readium-desktop/models/downloadable";
import { Error } from "readium-desktop/models/error";
import { Publication } from "readium-desktop/models/publication";

import { PublicationMessage } from "readium-desktop/models/ipc";

import { AppState } from "readium-desktop/main/reducers";

import { container } from "readium-desktop/main/di";

import { PublicationStorage } from "readium-desktop/main/storage/publication-storage";

import { File } from "readium-desktop/models/file";

import { PublicationDb } from "readium-desktop/main/db/publication-db";

import { Store } from "redux";

enum PublicationDownloadResponseType {
    Error, // Publication download error
    Add, // Add publication download
    Cancel, // Cancel publication download
}

interface PublicationDownloadResponse {
    type: PublicationDownloadResponseType;
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

export function* watchPublicationDownloadUpdate(): SagaIterator {
    let buffer: Buffer<any> = buffers.expanding(20);
    let chan = yield actionChannel([
            PUBLICATION_DOWNLOAD_ADD,
            PUBLICATION_DOWNLOAD_START,
            PUBLICATION_DOWNLOAD_CANCEL,
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
                console.log("### progress", action.progress);
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
            case PUBLICATION_DOWNLOAD_CANCEL:
                console.log("### cancel");
                const state: AppState =  yield select();
                const downloads = state.publicationDownloads
                    .publicationIdentifierToDownloads[publication.identifier];

                // Cancel each downloads linked to this publication
                for (const download of downloads) {
                    yield put(DownloaderAction.cancel(download));
                }

                publication.download = {
                    progress: action.progress,
                    status: DownloadStatus.Canceled,
                };
                break;
            default:
                break;
        }
        yield fork(addPublicationToDb, publication);

        yield put(catalogActions.updatePublication(
            publication,
        ));

        yield put(catalogActions.load());
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
        const publication = state.publicationDownloads
            .downloadIdentifierToPublication[download.identifier];
        const publicationStorage: PublicationStorage = container.get(
            "publication-storage") as PublicationStorage;

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
                publicationStorage.storePublication(publication.identifier, download.dstPath).then((files) => {
                    addPublicationToDb(publication, files);
                });
                break;
            default:
                break;
        }
    }
}

function addPublicationToDb (publication: Publication, files?: File[]) {
    const publicationDb: PublicationDb = container.get(
            "publication-db") as PublicationDb;
    const db: PublicationDb = container.get("publication-db") as PublicationDb;
    const store: Store<AppState> = container.get("store") as Store<AppState>;

    let oldFiles: File[];

    if (files) {
        oldFiles = files;
    } else {
        oldFiles = publication.files;
    }

    let newPub: Publication = {
            title: publication.title, // note: can be multilingual object map (not just string)
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

function CreateCustomCover (): CustomCover {
    let newColors = CustomCoverColors[Math.floor(Math.random() * CustomCoverColors.length)];
    return newColors;
}

function waitForPublicationDownloadRequest(
    chan: Channel<PublicationDownloadResponse>,
) {
    // Wait for catalog request from a renderer process
    ipcMain.on(
        PUBLICATION_DOWNLOAD_REQUEST,
        (event: any, msg: PublicationMessage) => {
            chan.put({
                type: PublicationDownloadResponseType.Add,
                publication: msg.publication,
            });
        },
    );
}

function waitForPublicationDownloadCancel(
    chan: Channel<PublicationDownloadResponse>,
) {
    // Wait for catalog request from a renderer process
    ipcMain.on(
        PUBLICATION_DOWNLOAD_CANCEL_REQUEST,
        (event: any, msg: PublicationMessage) => {
            chan.put({
                type: PublicationDownloadResponseType.Cancel,
                publication: msg.publication,
            });
        },
    );
}

export function* watchRendererPublicationDownloadRequest(): SagaIterator {
    const chan = yield call(channel);

    yield fork(waitForPublicationDownloadRequest, chan);
    yield fork(waitForPublicationDownloadCancel, chan);

    while (true) {
        const response: PublicationDownloadResponse = yield take(chan);

        switch (response.type) {
            case PublicationDownloadResponseType.Add:
                yield put(publicationDownloadActions.add(response.publication));
                break;
            case PublicationDownloadResponseType.Cancel:
                yield put(publicationDownloadActions.cancel(response.publication));
                break;
            default:
                break;
        }
    }
}
