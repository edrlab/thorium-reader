// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { TApiMethod } from "readium-desktop/common/api/api.type";
import { DialogType, DialogTypeName } from "readium-desktop/common/models/dialog";
import { apiActions, dialogActions } from "readium-desktop/common/redux/actions";
import { takeSpawnEvery } from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { IRendererCommonRootState } from "readium-desktop/common/redux/states/rendererCommonRootState";
import { PublicationView } from "readium-desktop/common/views/publication";
import { TReturnPromiseOrGeneratorType } from "readium-desktop/typings/api";
import { stringArrayEqual } from "readium-desktop/utils/stringArrayEqual";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { call, put, race, take } from "redux-saga/effects";
import { select as selectTyped } from "typed-redux-saga/macro";

// Logger
const filename_ = "readium-desktop:renderer:redux:saga:publication-info-syncTags";
const debug = debug_(filename_);
debug("_");

function* apiResult(action: apiActions.result.TAction) {

    // format the received API payload
    if (!action.error) {
        if (action.meta.api.methodId === "updateTags") {
            const publicationView = action.payload as
                TReturnPromiseOrGeneratorType<TApiMethod["publication/updateTags"]>;
            const tagsArray = publicationView.tags;
            const publicationFromDialog = (yield* selectTyped((state: IRendererCommonRootState) =>
                // tslint:disable-next-line: max-line-length
                (state.dialog.data as DialogType[DialogTypeName.PublicationInfoReader])?.publication)) as PublicationView;

            if (
                publicationFromDialog.identifier === publicationView.identifier
                && !stringArrayEqual(tagsArray, publicationFromDialog.tags)
            ) {
                yield put(dialogActions.updateRequest.build<DialogTypeName.PublicationInfoLib>(
                    {
                        publication: {
                            ...publicationFromDialog,
                            ...{
                                tags: tagsArray,
                            },
                        },
                    },
                ));
            }
        }
    }
}

function* dialogOpened(_action: dialogActions.openRequest.TAction) {

    while (true) {
        const { api, can } = yield race({
            api: take(apiActions.result.ID),
            can: take(dialogActions.closeRequest.ID),
        });

        if (can) {
            return ;
        }

        yield call(apiResult, api);
    }
}

export function saga() {
    return takeSpawnEvery(
        dialogActions.openRequest.ID,
        dialogOpened,
    );
}
