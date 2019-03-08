// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as path from "path";

import { SagaIterator } from "redux-saga";
import { call, put, take } from "redux-saga/effects";

import { doTryLcpPass } from "@r2-navigator-js/electron/main/lcp";

import { Publication } from "readium-desktop/common/models/publication";

import { Server } from "@r2-streamer-js/http/server";

import { container } from "readium-desktop/main/di";

import { IDeviceIDManager } from "@r2-lcp-js/lsd/deviceid-manager";
import { lsdRenew } from "@r2-lcp-js/lsd/renew";
import { lsdReturn } from "@r2-lcp-js/lsd/return";

import { CatalogService } from "readium-desktop/main/services/catalog";
import { PublicationStorage } from "readium-desktop/main/storage/publication-storage";

import { catalogActions, lcpActions, readerActions } from "readium-desktop/common/redux/actions";

import { toSha256Hex, updateLicenseStatus } from "readium-desktop/utils/lcp";

import { requestGet } from "readium-desktop/utils/http";

import { CodeError } from "readium-desktop/common/errors";

import { PublicationView } from "readium-desktop/common/views/publication";

export function* lcpPassphraseSubmitRequestWatcher(): SagaIterator {
    while (true) {
        const action = yield take(lcpActions.ActionType.PassphraseSubmitRequest);
        const passphrase: string = action.payload.passphrase;
        const publication: PublicationView = action.payload.publication;

        // Get epub file from publication
        const pubStorage = container.get("publication-storage") as PublicationStorage;
        const epubPath = pubStorage.getPublicationEpubPath(publication.identifier);

        // Test user passphrase
        const streamer = container.get("streamer") as Server;

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

            // New secret that rocks
            // secretManager.storeSecret(sha256HexPassphrase);
        } catch (error) {
            let payload = new CodeError(error);

            if (error instanceof Error) {
                payload = new CodeError(1);
            }

            yield put({
                type: lcpActions.ActionType.UserKeyCheckError,
                error: true,
                payload,
                meta: {
                    publication,
                },
            });
            continue;
        }

        yield put({
            type: lcpActions.ActionType.UserKeyCheckSuccess,
            payload: {
                publication,
            },
        });
    }
}

// export function* lcpUserKeyCheckRequestWatcher(): SagaIterator {
//     while (true) {
//         const action = yield take(lcpActions.ActionType.UserKeyCheckRequest);

//         const publication: Publication = action.payload.publication;

//         // Get epub file from publication
//         const pubStorage = container.get("publication-storage") as PublicationStorage;
//         console.log("==================================", action.payload.hint);
//         const epubPath = path.join(
//             pubStorage.getRootPath(),
//             publication.files[0].url.substr(6),
//         );

//         // Test user passphrases
//         const streamer: Server = container.get("streamer") as Server;

//         try {
//             // const secret = yield take(lcpActions.ActionType.)
//             const sha256HexPassphrase = toSha256Hex("test");
//             yield call(() =>
//                 doTryLcpPass(
//                     streamer,
//                     epubPath,
//                     [ sha256HexPassphrase ],
//                     true,
//                 ),
//             );

//             yield put({
//                 type: lcpActions.ActionType.UserKeyCheckSuccess,
//                 payload: {
//                     publication,
//                 },
//             });
//         } catch (error) {
//             let payload = new CodeError(error);

//             if (error instanceof Error) {
//                 payload = new CodeError(1);
//             }

//             yield put({
//                 type: lcpActions.ActionType.UserKeyCheckError,
//                 payload,
//                 error: true,
//             });
//         }
//     }
// }

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
