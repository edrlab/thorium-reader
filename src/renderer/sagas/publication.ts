import { ipcRenderer } from "electron";
import { SagaIterator } from "redux-saga";
import { put, take } from "redux-saga/effects";

import {
    PUBLICATION_DOWNLOAD_CANCEL_REQUEST,
    PUBLICATION_DOWNLOAD_REQUEST,
    PUBLICATION_FILE_DELETE_REQUEST,
    PUBLICATION_FILE_IMPORT_REQUEST,
} from "readium-desktop/events/ipc";

import * as publicationImportActions from "readium-desktop/actions/collection-manager";
import * as publicationDownloadActions from "readium-desktop/actions/publication-download";

import { FilesMessage, PublicationMessage} from "readium-desktop/models/ipc";
import { Publication, getTitleString } from "readium-desktop/models/publication";

import *  as messageActions from "readium-desktop/renderer/actions/message";

function sendIPCAddDownload(msg: PublicationMessage) {
    ipcRenderer.send(PUBLICATION_DOWNLOAD_REQUEST, msg);
}

export function* watchPublicationDownloadAdd(): SagaIterator {

    // TODO: should get language from view state? (user preferences)
    const lang = "en";

    while (true) {
        let resp = yield take(publicationDownloadActions.PUBLICATION_DOWNLOAD_ADD);
        let pub: Publication = resp.publication;
        let msg: PublicationMessage = { publication: pub};
        yield put(messageActions.add("Le téléchargement de " + getTitleString(pub.title, lang) + " a commencé"));
        sendIPCAddDownload(msg);
    }
}

function sendIPCCancelDownload(msg: PublicationMessage) {
    ipcRenderer.send(PUBLICATION_DOWNLOAD_CANCEL_REQUEST, msg);
}

export function* watchPublicationDownloadCancel(): SagaIterator {

    // TODO: should get language from view state? (user preferences)
    const lang = "en";

    while (true) {
        let resp = yield take(publicationDownloadActions.PUBLICATION_DOWNLOAD_CANCEL);
        let pub: Publication = resp.publication;
        let msg: PublicationMessage = { publication: pub};
        yield put(messageActions.add("Le téléchargement de " + getTitleString(pub.title, lang) + " a bien été annulé"));
        sendIPCCancelDownload(msg);
    }
}

function sendIPCFileImport(msg: FilesMessage) {
    ipcRenderer.send(PUBLICATION_FILE_IMPORT_REQUEST, msg);
}

export function* watchPublicationImport(): SagaIterator {
    while (true) {
        let resp = yield take(publicationImportActions.PUBLICATION_FILE_IMPORT);
        let msg: FilesMessage = { paths: resp.paths};
        yield put(messageActions.add("Le fichier " + resp.paths + " a bien été importé"));
        sendIPCFileImport(msg);
    }
}

function sendIPCFileDelete(msg: FilesMessage) {
    ipcRenderer.send(PUBLICATION_FILE_DELETE_REQUEST, msg);
}

export function* watchPublicationDelete(): SagaIterator {
    while (true) {
        let resp = yield take(publicationImportActions.PUBLICATION_FILE_DELETE);
        let msg: FilesMessage = { identifier: resp.identifier};
        yield put(messageActions.add("Le fichier " + resp.identifier + " a bien été supprimé"));
        sendIPCFileDelete(msg);
    }
}
