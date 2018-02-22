import { ipcRenderer } from "electron";
import { SagaIterator } from "redux-saga";
import { put, take } from "redux-saga/effects";

import { publicationDownloadActions } from "readium-desktop/common/redux/actions";

import { Publication } from "readium-desktop/common/models/publication";

import { container } from "readium-desktop/renderer/di";

import { Translator } from "readium-desktop/common/services/translator";

import { getMultiLangString } from "readium-desktop/common/models/language";

import * as messageActions from "readium-desktop/renderer/actions/message";

export function* publicationDownloadAddSuccessWatcher(): SagaIterator {
    while (true) {
        const action = yield take(publicationDownloadActions.ActionType.AddSuccess);
        const pub: Publication = action.payload.publication;

        const translator: Translator = container.get(
            "tranlator") as Translator;

        const lang = "en";
        yield put(messageActions.add(
            translator.translate("message.download.startFirst") +
            getMultiLangString(pub.title, lang) +
            translator.translate("message.download.startSecond")));
    }
}

export function* publicationDownloadSuccessWatcher(): SagaIterator {
    while (true) {
        const action = yield take(publicationDownloadActions.ActionType.Success);
        const pub: Publication = action.payload.publication;

        const translator: Translator = container.get(
            "tranlator") as Translator;

        const lang = "en";
        yield put(messageActions.add(
            translator.translate("message.download.successFirst") +
            getMultiLangString(pub.title, lang) +
            translator.translate("message.download.successSecond")));
    }
}
