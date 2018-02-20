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

import { PublicationDb } from "readium-desktop/main/db/publication-db";
import { CatalogService } from "readium-desktop/main/services/catalog";

import { injectFileInZip } from "readium-desktop/utils/zip";
// import { injectFileInZip } from "@r2-utils-js/_utils/zip/zipInjector";

import * as fs from "fs";

import {
    catalogActions,
    publicationDownloadActions,
} from "readium-desktop/common/redux/actions";
import { appActions } from "readium-desktop/main/redux/actions";

export function* catalogFileImportWatcher(): SagaIterator {
    while (true) {
        const action = yield take(catalogActions.ActionType.FileImportRequest);
        const filePath = action.payload.path;

        // Get extension of file path
        const ext = path.extname(filePath);

        if (ext === ".epub") {
            yield put({
                type: catalogActions.ActionType.LocalPublicationImportRequest,
                payload: {
                    path: filePath,
                },
            });
        } else if (ext === ".lcpl") {
            yield put({
                type: catalogActions.ActionType.LocalLCPImportRequest,
                payload: {
                    path: filePath,
                },
            });
        } else {
            yield put({
                type: catalogActions.ActionType.FileImportError,
                error: true,
            });
        }
    }
}

export function* catalogLocalPublicationImportWatcher(): SagaIterator {
    while (true) {
        const action = yield take(catalogActions.ActionType.LocalPublicationImportRequest);
        const pubPath = action.payload.path;
        const catalogService = container.get(
            "catalog-service") as CatalogService;

        try {
            const storedPub = yield call(() =>
                catalogService.addPublicationFromLocalPath(
                    uuid.v4(),
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

export function* catalogLocalLCPImportWatcher(): SagaIterator {
    while (true) {
        let continueWaiting = true;

        const contentType = "application/epub+zip";

        const action = yield take(catalogActions.ActionType.LocalLCPImportRequest);
        const lcpPath = action.payload.path;

        const buffer = fs.readFileSync(lcpPath);
        const content = JSON.parse(buffer.toString());

        let epub;

        // search the path of the epub file
        if (content.links) {
            for (const link of content.links) {
                if (link.rel === "publication") {
                    epub = link;
                }
            }
        }

        const publication: Publication = {
            title: epub.title,
            description: "",
            identifier: uuid.v4(),
            authors: [],
            files: [
                {
                    url: epub.href,
                    ext: "epub",
                    contentType,
                },
            ],
        };

        // Refresh the catalog with the new downloaded catalog
        yield put({
            type: catalogActions.ActionType.PublicationAddSuccess,
            payload: {
                publication,
            },
        });

        // Start the download of the epub file
        yield put({
            type: publicationDownloadActions.ActionType.AddRequest,
            payload: {
                publication,
            },
        });

        while (continueWaiting) {
            const downloadAction = yield take(publicationDownloadActions.ActionType.Success);
            const newPublication = downloadAction.payload.publication;

            if (newPublication.identifier === publication.identifier) {
                // const newPub: Publication = yield call(
            //     () => catalogService.parseEpub(download.dstPath),
            // );
                for (const file of newPublication.files) {
                    const relativeUrl = file.url.substr(6);
                    const pubStorage: PublicationStorage = container.get("publication-storage") as PublicationStorage;
                    const filePath: string = path.join(pubStorage.getRootPath(), relativeUrl);

                    if (file.contentType !== contentType) {
                        // Bad mimetype
                        continue;
                    }

                    // Inject LCPL
                    try {
                        yield call(
                            () => injectFileInZip(
                                filePath,
                                filePath + ".lcp",
                                lcpPath,
                                "META-INF/license.lcpl",
                            ),
                        );
                    } catch (error) {
                        yield put({
                            type: catalogActions.ActionType.LocalLCPImportError,
                            error: true,
                        });
                    }

                    // Replace epub without LCP with a new one containing LCPL
                    try {
                        fs.unlinkSync(filePath);
                    } catch (error) {
                        console.log(error);
                        return;
                    }

                    try {
                        fs.renameSync(filePath + ".lcp", filePath);
                    } catch (error) {
                        console.log(error);
                        return;
                    }

                    // Update publication info and store them in db
                    const publicationDb = container.get(
                        "publication-db") as PublicationDb;
                    const catalogService = container.get(
                        "catalog-service") as CatalogService;
                    const lcpPublication = yield call(
                        () => catalogService.parseEpub(filePath),
                    );
                    lcpPublication.identifier = publication.identifier;
                    publicationDb.putOrChange(lcpPublication);

                    yield put({
                        type: catalogActions.ActionType.LocalLCPImportSuccess,
                        payload: {
                            publication: lcpPublication,
                        },
                    });
                }

                continueWaiting = false;
            }

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

        const pubStorage: PublicationStorage = container.get("publication-storage") as PublicationStorage;

        // Get publication db
        const publicationDb: PublicationDb = container.get(
            "publication-db") as PublicationDb;
        // Remove publication from catalog
        try {
            const result = yield call(() => publicationDb.remove(
                publication.identifier,
            ));
            pubStorage.removePublication(publication.identifier);
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
