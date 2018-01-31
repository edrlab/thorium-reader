import { BrowserWindow, ipcMain } from "electron";
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

import { container } from "readium-desktop/main/di";

import { PublicationDb } from "readium-desktop/main/db/publication-db";
import { CatalogService } from "readium-desktop/main/services/catalog";

import {
    catalogActions,
    publicationDownloadActions,
} from "readium-desktop/common/redux/actions";
import { appActions } from "readium-desktop/main/redux/actions";

export function* catalogLocalPublicationImportWatcher(): SagaIterator {
    while (true) {
        const action = yield take(catalogActions.ActionType.LocalPublicationImportRequest);
        const path = action.payload.path;
        const catalogService = container.get(
            "catalog-service") as CatalogService;

        try {
            const parsedEpub: Epub = yield call(() => EpubParsePromise(path));
            const authors: Contributor[] = [];

            if (parsedEpub.Metadata && parsedEpub.Metadata.Author) {
                for (const author of parsedEpub.Metadata.Author) {
                    const contributor: Contributor = {
                        name: author.Name as string,
                    };

                    authors.push(contributor);
                }
            }

            const newPub: Publication = {
                title: parsedEpub.Metadata.Title as string, // note: can be multilingual object map (not just string)
                description: parsedEpub.Metadata.Description,
                identifier: uuid.v4(),
                authors,
                languages: parsedEpub.Metadata.Language.map(
                    (code) => { return { code };
                }),
            };

            const storedPub = yield call(() =>
                catalogService.addPublicationFromLocalPath(
                    newPub,
                    action.payload.path,
            ));
            yield put({
                type: catalogActions.ActionType.LocalPublicationImportSuccess,
                payload: {
                    publication: storedPub,
                },
            });
        } catch (error) {
            // FIXME: send error and message
            yield put({
                type: catalogActions.ActionType.LocalPublicationImportError,
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

        // Get publication db
        const publicationDb: PublicationDb = container.get(
            "publication-db") as PublicationDb;
        // Remove publication from catalog
        try {
            const result = yield call(() => publicationDb.remove(
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

export function* catalogInitWatcher(): SagaIterator {
    yield take(appActions.ActionType.InitSuccess);

    // Get publication db
    const publicationDb: PublicationDb = container.get(
        "publication-db") as PublicationDb;

    // Init catalog store
    try {
        const result = yield call(() => publicationDb.getAll());
        yield put({
            type: catalogActions.ActionType.SetSuccess,
            payload: {
                publications: result,
            },
        });
    } catch (error) {
        yield put({ type: catalogActions.ActionType.SetError, error: true });
    }
}
