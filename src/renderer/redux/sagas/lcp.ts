import { SagaIterator } from "redux-saga";
import { call, fork, put, take } from "redux-saga/effects";

import { Publication } from "readium-desktop/common/models/publication";

import { container } from "readium-desktop/renderer/di";

import { Translator } from "readium-desktop/common/services/translator";

import { getMultiLangString } from "readium-desktop/common/models/language";

import { lcpActions } from "readium-desktop/common/redux/actions";

import * as messageActions from "readium-desktop/renderer/actions/message";

export function* lcpRenewSuccessWatcher(): SagaIterator {
    while (true) {
        const action = yield take(lcpActions.ActionType.RenewSuccess);
        const publication: Publication = action.payload.publication;

        const translator: Translator = container.get(
            "translator") as Translator;

        const lang = "en";
        yield put(messageActions.add(
            translator.translate("message.lcp.renewSuccessFirst") +
            getMultiLangString(publication.title, lang) +
            translator.translate("message.lcp.renewSuccessSecond")));
    }
}

export function* lcpRenewErrorWatcher(): SagaIterator {
    while (true) {
        const action = yield take(lcpActions.ActionType.RenewError);
        const publication: Publication = action.meta.publication;

        const translator: Translator = container.get(
            "translator") as Translator;

        const lang = "en";
        yield put(messageActions.add(
            translator.translate("message.lcp.renewErrorFirst") +
            getMultiLangString(publication.title, lang) +
            translator.translate("message.lcp.renewErrorSecond")));
    }
}

export function* lcpReturnSuccessWatcher(): SagaIterator {
    while (true) {
        const action = yield take(lcpActions.ActionType.ReturnSuccess);
        const publication: Publication = action.payload.publication;

        const translator: Translator = container.get(
            "translator") as Translator;

        const lang = "en";
        yield put(messageActions.add(
            translator.translate("message.lcp.returnSuccessFirst") +
            getMultiLangString(publication.title, lang) +
            translator.translate("message.lcp.returnSuccessSecond")));
    }
}

export function* lcpReturnErrorWatcher(): SagaIterator {
    while (true) {
        const action = yield take(lcpActions.ActionType.ReturnError);
        const publication: Publication = action.meta.publication;

        const translator: Translator = container.get(
            "translator") as Translator;

        const lang = "en";
        yield put(messageActions.add(
            translator.translate("message.lcp.returnErrorFirst") +
            getMultiLangString(publication.title, lang) +
            translator.translate("message.lcp.returnErrorSecond")));
    }
}

export function* lcpPassphraseSubmitErrorWatcher(): SagaIterator {
    while (true) {
        const action = yield take(lcpActions.ActionType.PassphraseSubmitError);
        const publication: Publication = action.meta.publication;

        const translator: Translator = container.get(
            "translator") as Translator;

        const lang = "en";
        yield put(messageActions.add(
            translator.translate("message.lcp.passphraseError", {
                publicationTitle: getMultiLangString(publication.title, lang),
            }),
        ));
    }
}
