import { ipcRenderer } from "electron";
import { SagaIterator } from "redux-saga";
import { put, take } from "redux-saga/effects";

import { publicationDownloadActions } from "readium-desktop/common/redux/actions";

import { Publication, getTitleString } from "readium-desktop/common/models/publication";

import *  as messageActions from "readium-desktop/renderer/actions/message";

export function* publicationDownloadAddSuccessWatcher(): SagaIterator {
    while (true) {
        const action = yield take(publicationDownloadActions.ActionType.AddSuccess);
        const pub: Publication = action.payload.publication;
        // FIXME: translate message
        const lang = "en";
        yield put(messageActions.add("Le téléchargement de " + getTitleString(pub.title, lang) + " a commencé"));
    }
}

export function* publicationDownloadSuccessWatcher(): SagaIterator {
    while (true) {
        const action = yield take(publicationDownloadActions.ActionType.Success);
        const pub: Publication = action.payload.publication;
        // FIXME: translate message
        const lang = "en";
        yield put(messageActions.add("Le téléchargement de " + getTitleString(pub.title, lang) + " est terminé"));
    }
}
