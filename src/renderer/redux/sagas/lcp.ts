// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { SagaIterator } from "redux-saga";
import { call, fork, put, take } from "redux-saga/effects";

import { Publication } from "readium-desktop/common/models/publication";

import { container } from "readium-desktop/renderer/di";

import { Translator } from "readium-desktop/common/services/translator";

import { lcpActions } from "readium-desktop/common/redux/actions";

import * as messageActions from "readium-desktop/renderer/actions/message";

import { open } from "readium-desktop/common/redux/actions/dialog";

import { DialogType } from "readium-desktop/common/models/dialog";

export function* lcpRenewSuccessWatcher(): SagaIterator {
    while (true) {
        const action = yield take(lcpActions.ActionType.RenewSuccess);
        const publication: Publication = action.payload.publication;

        const translator: Translator = container.get(
            "translator") as Translator;

        const lang = "en";
        yield put(messageActions.add(
            translator.translate(
                "message.lcp.renewSuccess", {
                    title: translator.translateContentField(publication.title),
                },
            ),
        ));
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
            translator.translate(
                "message.lcp.renewError",
                {
                    title: translator.translateContentField(publication.title),
                },
            ),
        ));
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
            translator.translate(
                "message.lcp.returnSuccess", {
                    title: translator.translateContentField(publication.title),
                },
            ),
        ));
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
            translator.translate(
                "message.lcp.returnError", {
                    title: translator.translateContentField(publication.title),
                },
            ),
        ));
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
            translator.translate(
                "message.lcp.passphraseError", {
                publicationTitle: translator.translateContentField(
                    publication.title,
                ),
            }),
        ));
    }
}

export function* lcpUserKeyCheckRequestWatcher(): SagaIterator {
    while (true) {
        const action = yield take(lcpActions.ActionType.UserKeyCheckRequest);

        const { hint, publication } = action.payload;

        yield put(open(DialogType.LCPAuthentication, {publication, hint}));
    }
}
