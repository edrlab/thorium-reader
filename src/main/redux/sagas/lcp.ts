import * as path from "path";
import * as request from "request";

import { SagaIterator } from "redux-saga";
import { call, fork, put, take } from "redux-saga/effects";

import { doTryLcpPass } from "@r2-navigator-js/electron/main/lcp";

import { OPDS } from "readium-desktop/common/models/opds";

import { Publication } from "readium-desktop/common/models/publication";

import { Server } from "@r2-streamer-js/http/server";

import { ConfigDb } from "readium-desktop/main/db/config-db";

import { container } from "readium-desktop/main/di";

import { IDeviceIDManager } from "@r2-lcp-js/lsd/deviceid-manager";
import { lsdRenew } from "@r2-lcp-js/lsd/renew";
import { lsdReturn } from "@r2-lcp-js/lsd/return";

import { Publication as Epub } from "@r2-shared-js/models/publication";

import { EpubParsePromise } from "@r2-shared-js/parser/epub";

import { DeviceIdManager } from "readium-desktop/main/services/lcp";

import { CatalogService } from "readium-desktop/main/services/catalog";
import { PublicationStorage } from "readium-desktop/main/storage/publication-storage";

import { catalogActions, lcpActions, readerActions } from "readium-desktop/common/redux/actions";
import { appActions } from "readium-desktop/main/redux/actions";

import { toSha256Hex, updateLicenseStatus } from "readium-desktop/utils/lcp";

import { requestGet } from "readium-desktop/utils/http";

import { CodeError } from "readium-desktop/common/errors";

// List of sha256HexPassphrases, the user has tried and that rocks
const sha256HexPassphrases: string[] = [];

export function* lcpPassphraseSubmitRequestWatcher(): SagaIterator {
    while (true) {
        const action = yield take(lcpActions.ActionType.PassphraseSubmitRequest);
        const passphrase: string = action.payload.passphrase;
        const publication: Publication = action.payload.publication;

        // Get epub file from publication
        const pubStorage = container.get("publication-storage") as PublicationStorage;
        const epubPath = path.join(
            pubStorage.getRootPath(),
            publication.files[0].url.substr(6),
        );

        // Test user passphrase
        const streamer: Server = container.get("streamer") as Server;

        try {
            // Create sha256 in hex of passphrase
            const sha256HexPassphrase = toSha256Hex(passphrase);

            yield call(() =>
                doTryLcpPass(
                    streamer,
                    epubPath,
                    [ sha256HexPassphrase ],
                    true,
                ),
            );

            if (sha256HexPassphrases.indexOf(sha256HexPassphrase) === -1) {
                // new passphrase that rocks
                sha256HexPassphrases.push(sha256HexPassphrase);
            }
        } catch (error) {
            let payload = new CodeError(error);

            if (error instanceof Error) {
                payload = new CodeError(1);
            }

            yield put({
                type: lcpActions.ActionType.PassphraseSubmitError,
                error: true,
                payload,
                meta: {
                    publication,
                },
            });
            continue;
        }

        yield put({
            type: lcpActions.ActionType.PassphraseSubmitSuccess,
            payload: {
                publication,
            },
        });

        // Open reader
        yield put(readerActions.open(publication));
    }
}

export function* lcpUserKeyCheckRequestWatcher(): SagaIterator {
    while (true) {
        const action = yield take(lcpActions.ActionType.UserKeyCheckRequest);

        const publication: Publication = action.payload.publication;

        // Get epub file from publication
        const pubStorage = container.get("publication-storage") as PublicationStorage;
        const epubPath = path.join(
            pubStorage.getRootPath(),
            publication.files[0].url.substr(6),
        );

        // Test user passphrases
        const streamer: Server = container.get("streamer") as Server;

        try {
            yield call(() =>
                doTryLcpPass(
                    streamer,
                    epubPath,
                    sha256HexPassphrases,
                    true,
                ),
            );

            yield put({
                type: lcpActions.ActionType.UserKeyCheckSuccess,
                payload: {
                    publication,
                },
            });
        } catch (error) {
            let payload = new CodeError(error);

            if (error instanceof Error) {
                payload = new CodeError(1);
            }

            yield put({
                type: lcpActions.ActionType.UserKeyCheckError,
                payload,
                error: true,
            });
        }
    }
}

export function* lcpStatusUpdateRequestWatcher(): SagaIterator {
    while (true) {
        const action = yield take(lcpActions.ActionType.StatusUpdateRequest);
        const publication: Publication = action.payload.publication;

        try {
            yield call(() => updateLicenseStatus(publication));
        } catch (error) {
            yield put({
                type: lcpActions.ActionType.StatusUpdateError,
                error: true,
                meta: {
                    publication,
                },
            });
            continue;
        }

        yield put({
            type: lcpActions.ActionType.StatusUpdateError,
            payload: {
                publication,
            },
        });
    }
}

export function* lcpReturnRequestWatcher(): SagaIterator {
    while (true) {
        const action = yield take(lcpActions.ActionType.ReturnRequest);
        const publication: Publication = action.payload.publication;

        // FIXME: do it in catalog service
        // First update license
        try {
            yield call(() => updateLicenseStatus(publication));
        } catch (error) {
            yield put({
                type: lcpActions.ActionType.ReturnError,
                error: true,
                meta: {
                    publication,
                },
            });
            continue;
        }

        // and refresh metadata
        const catalogService = container.get("catalog-service") as CatalogService;
        let refreshedPublication = yield call(
            () => catalogService.refreshPublicationMetadata(publication),
        );
        yield put({
            type: catalogActions.ActionType.PublicationAddSuccess,
            payload: {
                publication: refreshedPublication,
            },
        });

        // Get lsd status
        let lsdStatus: any = null;

        try {
            const lsdResponse = yield call(() => requestGet(
                publication.lcp.lsd.statusUrl,
                {timeout: 5000, json: true},
            ));
            lsdStatus = lsdResponse.body;
        } catch (error) {
            yield put({
                type: lcpActions.ActionType.RenewError,
                error: true,
                meta: {
                    publication,
                },
            });
            continue;
        }

        // LSD return
        const deviceIdManager = container.get("device-id-manager") as IDeviceIDManager;

        try {
            const returnResult = yield call(
                () => lsdReturn(lsdStatus, deviceIdManager),
            );

            // FIXME: do it in catalog service
            yield call(() => updateLicenseStatus(publication));
            refreshedPublication = yield call(
                () => catalogService.refreshPublicationMetadata(publication),
            );
            yield put({
                type: catalogActions.ActionType.PublicationAddSuccess,
                payload: {
                    publication: refreshedPublication,
                },
            });
        } catch (error) {
            yield put({
                type: lcpActions.ActionType.ReturnError,
                error: true,
                meta: {
                    publication,
                },
            });
            continue;
        }

        yield put({
            type: lcpActions.ActionType.ReturnSuccess,
            payload: {
                publication,
            },
        });
    }
}

export function* lcpRenewRequestWatcher(): SagaIterator {
    while (true) {
        const action = yield take(lcpActions.ActionType.RenewRequest);
        const publication: Publication = action.payload.publication;

        // FIXME: do it in catalog service
        // First update license
        try {
            yield call(() => updateLicenseStatus(publication));
        } catch (error) {
            yield put({
                type: lcpActions.ActionType.RenewError,
                error: true,
                meta: {
                    publication,
                },
            });
            continue;
        }

        // and refresh metadata
        const catalogService = container.get("catalog-service") as CatalogService;
        let refreshedPublication = yield call(
            () => catalogService.refreshPublicationMetadata(publication),
        );
        yield put({
            type: catalogActions.ActionType.PublicationAddSuccess,
            payload: {
                publication: refreshedPublication,
            },
        });

        // Get lsd status
        let lsdStatus: any = null;

        try {
            const lsdResponse = yield call(() => requestGet(
                publication.lcp.lsd.statusUrl,
                {timeout: 5000, json: true},
            ));
            lsdStatus = lsdResponse.body;
        } catch (error) {
            yield put({
                type: lcpActions.ActionType.RenewError,
                error: true,
                meta: {
                    publication,
                },
            });
            continue;
        }

        // LSD renew
        const streamer = container.get("streamer") as Server;
        const deviceIdManager = container.get("device-id-manager") as IDeviceIDManager;

        try {
            const renewResult = yield call(
                () => lsdRenew(undefined, lsdStatus, deviceIdManager),
            );

            // FIXME: do it in catalog service
            yield call(() => updateLicenseStatus(publication));
            refreshedPublication = yield call(
                () => catalogService.refreshPublicationMetadata(publication),
            );
            yield put({
                type: catalogActions.ActionType.PublicationAddSuccess,
                payload: {
                    publication: refreshedPublication,
                },
            });
        } catch (error) {
            yield put({
                type: lcpActions.ActionType.RenewError,
                error: true,
                meta: {
                    publication,
                },
            });
            continue;
        }

        yield put({
            type: lcpActions.ActionType.RenewSuccess,
            payload: {
                publication,
            },
        });
    }
}
