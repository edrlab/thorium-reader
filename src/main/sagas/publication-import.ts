import { ipcMain } from "electron";
import { Buffer, buffers, channel, Channel, SagaIterator } from "redux-saga";
import { actionChannel, call, fork, put, take } from "redux-saga/effects";
import * as uuid from "uuid";

import { PUBLICATION_FILE_IMPORT_REQUEST } from "readium-desktop/events/ipc";

import {
    PUBLICATION_IMPORT_ADD,
    PublicationImportAction,
} from "readium-desktop/actions/publication-import";

import * as publicationImportActions
from "readium-desktop/actions/publication-import";

import { FilesMessage } from "readium-desktop/models/ipc";

import { EpubParsePromise } from "r2-streamer-js/dist/es5/src/parser/epub";

import { Publication } from "readium-desktop/models/publication";

import { PublicationDb } from "readium-desktop/main/db/publication-db";
import { PublicationStorage } from "readium-desktop/main/storage/publication-storage";

import { container } from "readium-desktop/main/di";

enum PublicationImportResponseType {
    Add, // Add files import
}

interface PublicationImportResponse {
    type: PublicationImportResponseType;
    paths: string[];
    error?: Error;
}

export function* watchPublicationImportUpdate(): SagaIterator {
    let buffer: Buffer<any> = buffers.expanding(20);
    let chan = yield actionChannel([
            PUBLICATION_IMPORT_ADD,
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
                    Promise.resolve(EpubParsePromise(path).then((value: any) => {
                        // Create identifier for this publication
                        let pub: Publication = {
                            title: value.Metadata.Title,
                            description: value.Metadata.Description,
                            identifier: uuid.v4(),
                            authors: value.Metadata.Author,
                            languages: value.Metadata.Language,
                        };

                        // Store publication files
                        publicationStorage.storePublication(
                            pub.identifier,
                            path,
                        );

                        // Store publication metadata
                        publicationDb.put(pub);
                    }),
                    );
                }
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
            console.log("Import file ipc");
            chan.put({
                type: PublicationImportResponseType.Add,
                paths: msg.paths,
            });
        });
}

export function* watchRendererPublicationImportRequest(): SagaIterator {
    const chan = yield call(channel);

    yield fork(waitForPublicationFileImport, chan);

    while (true) {
        const response: PublicationImportResponse = yield take(chan);

        switch (response.type) {
            case PublicationImportResponseType.Add:
            console.log ("hello,");
                yield put(publicationImportActions.add(response.paths));

                break;
            default:
                break;
        }
    }
}
