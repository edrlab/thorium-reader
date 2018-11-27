// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import { Store } from "redux";
import { Buffer, buffers, channel, Channel, delay, SagaIterator } from "redux-saga";
import { actionChannel, call, fork, put, take } from "redux-saga/effects";
import * as request from "request";
import * as uuid from "uuid";

import { Publication as Epub } from "@r2-shared-js/models/publication";
import { EpubParsePromise } from "@r2-shared-js/parser/epub";

import { Catalog } from "readium-desktop/common/models/catalog";
import { Contributor } from "readium-desktop/common/models/contributor";
import { Error } from "readium-desktop/common/models/error";
import { Publication } from "readium-desktop/common/models/publication";

import { OPDSParser } from "readium-desktop/common/services/opds";

import { RootState } from "readium-desktop/main/redux/states";

import { PublicationStorage } from "readium-desktop/main/storage/publication-storage";

import { container } from "readium-desktop/main/di";

import { PublicationRepository } from "readium-desktop/main/db/repository/publication";
import { CatalogService } from "readium-desktop/main/services/catalog";

import { injectFileInZip } from "readium-desktop/utils/zip";

import * as fs from "fs";

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

export function* addTagWatcher(): SagaIterator {
    yield take(catalogActions.ActionType.TagAddRequest);

    yield put({
        type: catalogActions.ActionType.TagAddSuccess,
    });
}

export function* editTagWatcher(): SagaIterator {
    yield take(catalogActions.ActionType.TagEditRequest);

    yield put({
        type: catalogActions.ActionType.TagEditSuccess,
    });
}

export function* removeTagWatcher(): SagaIterator {
    yield take(catalogActions.ActionType.TagRemoveRequest);

    yield put({
        type: catalogActions.ActionType.TagRemoveSuccess,
    });
}
