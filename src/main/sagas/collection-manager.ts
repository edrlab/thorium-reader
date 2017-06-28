import { ipcMain } from "electron";
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

import * as publicationImportActions
from "readium-desktop/actions/collection-manager";

import { FilesMessage } from "readium-desktop/models/ipc";

import { EpubParsePromise } from "r2-streamer-js/dist/es5/src/parser/epub";

import { Publication } from "readium-desktop/models/publication";

import { PublicationDb } from "readium-desktop/main/db/publication-db";
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

        switch (action.type) {
            case PUBLICATION_IMPORT_ADD:
                for (const path of action.paths) {
                    // Parse epub and extract its metadata
                    Promise.resolve(EpubParsePromise(path).then((pub: any) => {

                        let newPub: Publication = {
                            title: pub.Metadata.Title,
                            description: pub.Metadata.Description,
                            identifier: uuid.v4(),
                            authors: pub.Metadata.Author,
                            languages: pub.Metadata.Language,
                        };
                        // Store publication files
                        publicationStorage.storePublication(
                            newPub.identifier,
                            path,
                        );

                        // Store publication metadata
                        publicationDb.put(newPub);
                    }),
                    );
                }
                break;
            case PUBLICATION_FILE_DELETE:
                publicationStorage.deletePublication(action.identifier);
                break;
            default:
                break;
        }
    }
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
