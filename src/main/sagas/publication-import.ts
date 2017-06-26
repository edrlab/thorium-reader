import { ipcMain } from "electron";
import { Buffer, buffers, channel, Channel, SagaIterator } from "redux-saga";
import { actionChannel, call, fork, put, take } from "redux-saga/effects";

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

        switch (action.type) {
            case PUBLICATION_IMPORT_ADD:
                console.log("### import : ", action.paths);
                Promise.resolve(EpubParsePromise(action.paths[0])).then((value: any) => {
                    let pub: Publication = {
                        title: value.Metadata.Title,
                        description: value.Metadata.Description,
                        identifier: "",
                        authors: value.Metadata.Author,
                        language: value.Metadata.Language,
                    };
                });
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
