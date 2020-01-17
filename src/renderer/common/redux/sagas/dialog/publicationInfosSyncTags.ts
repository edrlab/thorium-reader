// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { DialogType, DialogTypeName } from "readium-desktop/common/models/dialog";
import { apiActions, dialogActions } from "readium-desktop/common/redux/actions";
import { selectTyped } from "readium-desktop/common/redux/typed-saga";
import { TApiMethod } from "readium-desktop/main/api/api.type";
import { ReturnPromiseType } from "readium-desktop/typings/promise";
import { stringArrayEqual } from "readium-desktop/utils/stringArrayEqual";
import { all, call, put, takeEvery } from "redux-saga/effects";
import { ICommonRootState } from "../../states";

function* apiResult(action: apiActions.result.TAction) {

    // format the received API payload
    if (!action.error) {
        if (action.meta.api.methodId === "updateTags") {
            const publicationView = action.payload as ReturnPromiseType<TApiMethod["publication/updateTags"]>;
            const tagsArray = publicationView.tags;
            const publicationFromDialog = yield* selectTyped((state: ICommonRootState) =>
                (state.dialog.data as DialogType[DialogTypeName.PublicationInfoReader])?.publication);

            if (!stringArrayEqual(tagsArray, publicationFromDialog.tags as string[])) {
                yield put(dialogActions.updateRequest.build<DialogTypeName.PublicationInfoLib>(
                    {
                        publication: Object.assign({}, publicationFromDialog, { tags: tagsArray }),
                    },
                ));
            }
        }
    }
}

function* dialogOpened(_action: dialogActions.openRequest.TAction) {
    yield takeEvery(apiActions.result.build, apiResult);
}

function* localeWatcher() {
    yield takeEvery(dialogActions.openRequest.build, dialogOpened);
}

export function* watchers() {
    yield all([
        call(localeWatcher),
    ]);
}
