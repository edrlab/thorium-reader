import { ipcRenderer } from "electron";
import { SagaIterator } from "redux-saga";
import { put, take } from "redux-saga/effects";

import * as publicationImportActions from "readium-desktop/actions/collection-manager";
import { publicationDownloadActions } from "readium-desktop/common/redux/actions";

import { Publication, getTitleString } from "readium-desktop/common/models/publication";

import *  as messageActions from "readium-desktop/renderer/actions/message";

export function* watchPublicationDownloadAddSuccess(): SagaIterator {
    while (true) {
        const action = yield take(publicationDownloadActions.ActionType.AddSuccess);
        const pub: Publication = action.payload.publication;
        // FIXME: translate message
        const lang = "en";
        yield put(messageActions.add("Le téléchargement de " + getTitleString(pub.title, lang) + " a commencé"));
    }
}

export function* watchPublicationDownloadSuccess(): SagaIterator {
    while (true) {
        const action = yield take(publicationDownloadActions.ActionType.Success);
        const pub: Publication = action.payload.publication;
        // FIXME: translate message
        const lang = "en";
        yield put(messageActions.add("Le téléchargement de " + getTitleString(pub.title, lang) + " est terminé"));
    }
}

// function sendIPCFileImport(msg: FilesMessage) {
//     //ipcRenderer.send(PUBLICATION_FILE_IMPORT_REQUEST, msg);
// }

// export function* watchPublicationImport(): SagaIterator {
//     while (true) {
//         let resp = yield take(publicationImportActions.PUBLICATION_FILE_IMPORT);
//         let msg: FilesMessage = { paths: resp.paths};
//         yield put(messageActions.add("Le fichier " + resp.paths + " a bien été importé"));
//         sendIPCFileImport(msg);
//     }
// }

// function sendIPCFileDelete(msg: FilesMessage) {
//     ipcRenderer.send(PUBLICATION_FILE_DELETE_REQUEST, msg);
// }

// export function* watchPublicationDelete(): SagaIterator {
//     while (true) {
//         let resp = yield take(publicationImportActions.PUBLICATION_FILE_DELETE);
//         let msg: FilesMessage = { identifier: resp.identifier};
//         yield put(messageActions.add("Le fichier " + resp.identifier + " a bien été supprimé"));
//         sendIPCFileDelete(msg);
//     }
// }
