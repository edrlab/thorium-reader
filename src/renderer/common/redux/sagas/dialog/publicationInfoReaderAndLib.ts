// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { TApiMethod } from "readium-desktop/common/api/api.type";
import { DialogTypeName } from "readium-desktop/common/models/dialog";
import { apiActions, dialogActions } from "readium-desktop/common/redux/actions";
import { takeSpawnLeading } from "readium-desktop/common/redux/sagas/takeSpawnLeading";
import { PublicationView } from "readium-desktop/common/views/publication";
import { TReturnPromiseOrGeneratorType } from "readium-desktop/typings/api";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { all, call, put, take } from "redux-saga/effects";
import { call as callTyped } from "typed-redux-saga/macro";

import { MiniLocatorExtended } from "readium-desktop/common/redux/states/locatorInitialState";

import { apiSaga } from "../api";

const REQUEST_ID = "PUBINFO_READER_AND_LIB_REQUEST_ID";

// Logger
const filename_ = "readium-desktop:renderer:redux:saga:publication-info-readerAndLib";
const debug = debug_(filename_);

// Triggered when a publication-info-reader is asked
function* checkReaderAndLibPublication(action: dialogActions.openRequest.TAction) {
    if (
        action.payload?.type === DialogTypeName.PublicationInfoReader
        || action.payload?.type === DialogTypeName.PublicationInfoLib
    ) {

        const dataPayload = (action.payload as
            dialogActions.openRequest.Payload<DialogTypeName.PublicationInfoReader>).data;
        const id = dataPayload?.publicationIdentifier;
        const focusWhereAmI = dataPayload?.focusWhereAmI;

        // SUPER HACKY :(
        const pdfPlayerNumberOfPages = dataPayload?.pdfPlayerNumberOfPages;
        const divinaNumberOfPages = dataPayload?.divinaNumberOfPages;
        const divinaContinousEqualTrue = dataPayload?.divinaContinousEqualTrue;
        const readerReadingLocation = dataPayload?.readerReadingLocation;
        const handleLinkUrl = dataPayload?.handleLinkUrl;

        // dispatch to API a publication get request
        if (id) {
            {
                const getAction = yield* callTyped(getApi, id, false);
                if (!getAction) {
                    debug("checkReaderAndLibPublication 1 timeout?", id);
                    return;
                }
                yield call(updateReaderAndLibPublication, getAction, focusWhereAmI, pdfPlayerNumberOfPages, divinaNumberOfPages, divinaContinousEqualTrue, readerReadingLocation, handleLinkUrl);
            }

            const getAction = yield* callTyped(getApi, id, true);
            if (!getAction) {
                debug("checkReaderAndLibPublication 2 timeout?", id);
                return;
            }

            yield call(updateReaderAndLibPublication, getAction, focusWhereAmI, pdfPlayerNumberOfPages, divinaNumberOfPages, divinaContinousEqualTrue, readerReadingLocation, handleLinkUrl);
        }
    }
}

function* getApi(id: string, checkLcpLsd: boolean) {

    yield apiSaga("publication/get", REQUEST_ID, id, checkLcpLsd);
    while (true) {
        const action:
            apiActions.result.TAction<TReturnPromiseOrGeneratorType<TApiMethod["publication/get"]>>
            = yield take(apiActions.result.ID);

        const { requestId } = action.meta.api;
        if (requestId === REQUEST_ID) {
            return action;
        }
    }
}

// Triggered when the publication data are available from the API
function* updateReaderAndLibPublication(action: apiActions.result.TAction<PublicationView>, focusWhereAmI: boolean, pdfPlayerNumberOfPages: number | undefined, divinaNumberOfPages: number | undefined, divinaContinousEqualTrue: boolean, readerReadingLocation: MiniLocatorExtended | undefined, handleLinkUrl: ((url: string) => void) | undefined) {
    debug("reader publication from publicationInfo received");

    const publicationView = action.payload;

    if (publicationView) {
        debug("opdsPublicationResult:", publicationView);

        const publication = publicationView;

        yield put(dialogActions.updateRequest.build<DialogTypeName.PublicationInfoReader>({
            publication,
            focusWhereAmI,
            pdfPlayerNumberOfPages,
            divinaNumberOfPages,
            divinaContinousEqualTrue,
            readerReadingLocation,
            handleLinkUrl,
        }));
    }
}

export function saga() {
    return all([
        takeSpawnLeading(
            dialogActions.openRequest.ID,
            checkReaderAndLibPublication,
            (e) => debug(e),
        ),
    ]);
}

export const publicationInfoReaderLibGetPublicationApiCall = getApi;
