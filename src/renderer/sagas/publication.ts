import { ipcRenderer } from "electron";
import { SagaIterator } from "redux-saga";
import { take } from "redux-saga/effects";

import { PUBLICATION_DOWNLOAD_REQUEST } from "readium-desktop/events/ipc";

import * as catalogActions from "readium-desktop/actions/catalog";

import { PublicationMessage } from "readium-desktop/models/ipc";
import { Publication } from "readium-desktop/models/publication";

function sendIPCAddDownload(msg: PublicationMessage) {
    ipcRenderer.send(PUBLICATION_DOWNLOAD_REQUEST, msg);
}

export function* watchPublicationDownloadAdd(): SagaIterator {
    while (true) {
        let resp = yield take(catalogActions.PUBLICATION_DOWNLOAD_ADD);
        let pub: Publication = resp.publication;
        let msg: PublicationMessage = { publication: pub};
        sendIPCAddDownload(msg);
    }
}
