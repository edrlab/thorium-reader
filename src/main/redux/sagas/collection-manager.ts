import { ipcMain } from "electron";
import { Store } from "redux";
import { Buffer, buffers, channel, Channel, SagaIterator } from "redux-saga";
import { actionChannel, call, fork, put, take } from "redux-saga/effects";
import * as uuid from "uuid";

import {
    PUBLICATION_FILE_DELETE_REQUEST,
    PUBLICATION_FILE_IMPORT_REQUEST,
} from "readium-desktop/events/ipc";

import {
    PUBLICATION_FILE_DELETE,
    PUBLICATION_IMPORT_ADD,
    PublicationImportAction,
} from "readium-desktop/actions/collection-manager";

import * as catalogActions from "readium-desktop/actions/catalog";
import * as publicationImportActions
from "readium-desktop/actions/collection-manager";

import { FilesMessage } from "readium-desktop/common/models/ipc";

import { EpubParsePromise } from "@r2-shared-js/parser/epub";

import { Contributor } from "readium-desktop/common/models/contributor";
import { CustomCover, CustomCoverColors } from "readium-desktop/common/models/custom-cover";
import { File } from "readium-desktop/common/models/file";
import { Publication } from "readium-desktop/common/models/publication";

import { PublicationDb } from "readium-desktop/main/db/publication-db";
import { RootState } from "readium-desktop/main/redux/states";
import { PublicationStorage } from "readium-desktop/main/storage/publication-storage";

import { container } from "readium-desktop/main/di";

enum PublicationImportResponseType {
    Add, // Add files import
    Delete, // Delete a file
}

interface PublicationImportResponse {
    type: PublicationImportResponseType;
    paths?: string[];
    identifier?: string;
    error?: Error;
}

export function* watchPublicationUpdate(): SagaIterator {
    let buffer: Buffer<any> = buffers.expanding(20);
    let chan = yield actionChannel([
            PUBLICATION_IMPORT_ADD,
            PUBLICATION_FILE_DELETE,
        ], buffer);

    while (true) {
        const action: PublicationImportAction = yield take(chan);
        const publicationDb: PublicationDb = container.get(
            "publication-db") as PublicationDb;
        const publicationStorage: PublicationStorage = container.get(
            "publication-storage") as PublicationStorage;
        const store = container.get("store") as Store<RootState>;
        const db: PublicationDb = container.get("publication-db") as PublicationDb;
        switch (action.type) {
            case PUBLICATION_IMPORT_ADD:
                for (const path of action.paths) {
                    // Parse epub and extract its metadata
                    Promise.resolve(
                        EpubParsePromise(path)
                        .then((pub: any) => {
                            let authors: Contributor[] = [];

                            if (pub.Metadata && pub.Metadata.Author) {
                                for (let author of pub.Metadata.Author) {
                                    let contributor: Contributor = {
                                        name: author.Name,
                                    };

                                    authors.push(contributor);
                                }
                            }

                            let newPub: Publication = {
                                title: pub.Metadata.Title, // note: can be multilingual object map (not just string)
                                description: pub.Metadata.Description,
                                identifier: uuid.v4(),
                                authors,
                                languages: pub.Metadata.Language,
                            };
                            // Store publication files
                            publicationStorage
                                .storePublication(
                                    newPub.identifier,
                                    path,
                                )
                                .then((files) => {
                                    // Extract cover
                                    let coverFile: File = null;
                                    let otherFiles: File[] = [];

                                    for (let file of files) {
                                        if (file.contentType.startsWith("image")) {
                                            coverFile = file;
                                        } else {
                                            otherFiles.push(file);
                                        }
                                    }

                                    newPub.cover = coverFile;
                                    newPub.files = otherFiles;

                                    if (coverFile === null) {
                                        newPub.customCover = CreateCustomCover();
                                    }

                                    // Store publication metadata
                                    publicationDb
                                        .put(newPub)
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
                                })
                                .catch((err) => {
                                    console.log(err);
                                });
                        })
                        .catch((err) => {
                            console.log(err);
                        }),
                    );
                }
                break;
            case PUBLICATION_FILE_DELETE:
                // Remove from DB
                publicationDb
                    .remove(action.identifier)
                    .then((result) => {
                        // Then remove from fs
                        publicationStorage.removePublication(action.identifier);
                        store.dispatch(catalogActions.load());
                    });
                break;
            default:
                break;
        }
    }
}

function CreateCustomCover (): CustomCover {
    let newColors = CustomCoverColors[Math.floor(Math.random() * CustomCoverColors.length)];
    return newColors;
}

export function waitForPublicationFileImport(
    chan: Channel<PublicationImportResponse>,
) {
    ipcMain.on(
        PUBLICATION_FILE_IMPORT_REQUEST,
        (event: any, msg: FilesMessage) => {
            chan.put({
                type: PublicationImportResponseType.Add,
                paths: msg.paths,
            });
        });
}

export function waitForPublicationFileDelete(
    chan: Channel<PublicationImportResponse>,
) {
    ipcMain.on(
        PUBLICATION_FILE_DELETE_REQUEST,
        (event: any, msg: FilesMessage) => {
            chan.put({
                type: PublicationImportResponseType.Delete,
                identifier: msg.identifier,
            });
        });
}

export function* watchRendererPublicationRequest(): SagaIterator {
    const chan = yield call(channel);

    yield fork(waitForPublicationFileImport, chan);
    yield fork(waitForPublicationFileDelete, chan);

    while (true) {
        const response: PublicationImportResponse = yield take(chan);

        switch (response.type) {
            case PublicationImportResponseType.Add:
                yield put(publicationImportActions.add(response.paths));
                break;
            case PublicationImportResponseType.Delete:
                yield put(publicationImportActions.fileDelete(response.identifier));
                break;
            default:
                break;
        }
    }
}
