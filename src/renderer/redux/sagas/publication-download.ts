// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

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
            "translator") as Translator;

        const lang = "en";
        yield put(messageActions.add(
            translator.translate("message.download.start", {title: getMultiLangString(pub.title, lang)}),
        ));
    }
}

export function* publicationDownloadSuccessWatcher(): SagaIterator {
    while (true) {
        const action = yield take(publicationDownloadActions.ActionType.Success);
        const pub: Publication = action.payload.publication;

        const translator: Translator = container.get(
            "translator") as Translator;

        const lang = "en";
        yield put(messageActions.add(
            translator.translate("message.download.success", {title: getMultiLangString(pub.title, lang)}),
        ));
    }
}
