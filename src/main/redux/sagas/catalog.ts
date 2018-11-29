// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { SagaIterator } from "redux-saga";
import { call, put, take } from "redux-saga/effects";

import { container } from "readium-desktop/main/di";

import { CatalogService } from "readium-desktop/main/services/catalog";

import {
    catalogActions,
    publicationDownloadActions,
} from "readium-desktop/common/redux/actions";
import { appActions } from "readium-desktop/main/redux/actions";

export function* catalogFileImportWatcher(): SagaIterator {
    while (true) {
        const action = yield take(catalogActions.ActionType.FileImportRequest);
        const catalogService = container.get("catalog") as CatalogService;

        try {
            const storedPub = yield call(() =>
                catalogService.importFile(action.payload.path));
            yield put({
                type: catalogActions.ActionType.FileImportSuccess,
                payload: {
                    publication: storedPub,
                },
            });
        } catch (error) {
            // FIXME: send error and message
            yield put({
                type: catalogActions.ActionType.FileImportError,
                error: true,
            });
        }
    }
}

export function* catalogPublicationDownloadSuccessWatcher(): SagaIterator {
    while (true) {
        const action = yield take(publicationDownloadActions.ActionType.Success);
        const publication = action.payload.publication;

        // Refresh the catalog with the new downloaded catalog
        yield put({
            type: catalogActions.ActionType.PublicationAddSuccess,
            payload: {
                publication,
            },
        });
    }
}

export function* catalogPublicationRemoveWatcher(): SagaIterator {
    while (true) {
        const action = yield take(catalogActions.ActionType.PublicationRemoveRequest);
        const publication = action.payload.publication;

        const catalogService = container.get("catalog") as CatalogService;

        // Remove publication from catalog
        try {
            const result = yield call(() => catalogService.deletePublication(
                publication.identifier,
            ));
            yield put({
                type: catalogActions.ActionType.PublicationRemoveSuccess,
                payload: {
                    publication,
                },
            });
        } catch (error) {
            // FIXME: send error and message
            yield put({
                type: catalogActions.ActionType.PublicationRemoveError,
                error: true,
            });
        }
    }
}
