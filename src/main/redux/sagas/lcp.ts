import * as path from "path";

import { SagaIterator } from "redux-saga";
import { call, fork, put, take } from "redux-saga/effects";

import { doTryLcpPass } from "@r2-navigator-js/electron/main/lcp";

import { OPDS } from "readium-desktop/common/models/opds";

import { Publication } from "readium-desktop/common/models/publication";

import { Server } from "@r2-streamer-js/http/server";

import { ConfigDb } from "readium-desktop/main/db/config-db";

import { container } from "readium-desktop/main/di";

import { PublicationStorage } from "readium-desktop/main/storage/publication-storage";

import { lcpActions, readerActions } from "readium-desktop/common/redux/actions";
import { appActions } from "readium-desktop/main/redux/actions";

import { toSha256Hex } from "readium-desktop/utils/lcp";

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
            yield put({
                type: lcpActions.ActionType.PassphraseSubmitError,
                error: true,
                payload: new Error(error),
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
            yield put({
                type: lcpActions.ActionType.UserKeyCheckError,
                error: true,
            });
        }
    }
}

export function* lcpReturnRequestWatcher(): SagaIterator {
    while (true) {
        const action = yield take(lcpActions.ActionType.ReturnRequest);
        const publication: Publication = action.payload.publication;
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
        yield put({
            type: lcpActions.ActionType.RenewSuccess,
            payload: {
                publication,
            },
        });
    }
}
