import { ipcRenderer } from "electron";
import { SagaIterator } from "redux-saga";
import { take } from "redux-saga/effects";

import {
    PUBLICATION_DOWNLOAD_CANCEL_REQUEST,
    PUBLICATION_DOWNLOAD_REQUEST,
    PUBLICATION_FILE_IMPORT_REQUEST,
} from "readium-desktop/events/ipc";

import * as publicationDownloadActions from "readium-desktop/actions/publication-download";
import * as publicationImportActions from "readium-desktop/actions/publication-import";

import { FilesMessage, PublicationMessage} from "readium-desktop/models/ipc";
import { Publication } from "readium-desktop/models/publication";

function sendIPCAddDownload(msg: PublicationMessage) {
    ipcRenderer.send(PUBLICATION_DOWNLOAD_REQUEST, msg);
}

export function* watchPublicationDownloadAdd(): SagaIterator {
    while (true) {
        let resp = yield take(publicationDownloadActions.PUBLICATION_DOWNLOAD_ADD);
        let pub: Publication = resp.publication;
        let msg: PublicationMessage = { publication: pub};
        sendIPCAddDownload(msg);
    }
}

function sendIPCCancelDownload(msg: PublicationMessage) {
    ipcRenderer.send(PUBLICATION_DOWNLOAD_CANCEL_REQUEST, msg);
}

export function* watchPublicationDownloadCancel(): SagaIterator {
    while (true) {
        let resp = yield take(publicationDownloadActions.PUBLICATION_DOWNLOAD_CANCEL);
        let pub: Publication = resp.publication;
        let msg: PublicationMessage = { publication: pub};
        sendIPCCancelDownload(msg);
    }
}

function sendIPCFileImport(msg: FilesMessage) {
    ipcRenderer.send(PUBLICATION_FILE_IMPORT_REQUEST, msg);
}

export function* watchPublicationUpload(): SagaIterator {
    while (true) {
        let resp = yield take(publicationImportActions.PUBLICATION_FILE_IMPORT);
        let msg: FilesMessage = { paths: resp.paths};
        sendIPCFileImport(msg);
    }
}
