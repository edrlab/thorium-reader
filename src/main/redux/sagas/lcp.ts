import * as path from "path";

import { SagaIterator } from "redux-saga";
import { call, fork, put, take } from "redux-saga/effects";

import { doTryLcpPass } from "@r2-navigator-js/electron/main/lcp";

import { OPDS } from "readium-desktop/common/models/opds";

import { Publication } from "readium-desktop/common/models/publication";

import { Server } from "@r2-streamer-js/http/server";

import { container } from "readium-desktop/main/di";

import { PublicationStorage } from "readium-desktop/main/storage/publication-storage";

import { lcpActions } from "readium-desktop/common/redux/actions";

let passhphraseOk = false;

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
            yield call(() =>
                doTryLcpPass(
                    streamer,
                    epubPath,
                    [ passphrase ],
                    false,
                ),
            );
            passhphraseOk = true;
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
    }
}

export function* lcpUserKeyCheckRequestWatcher(): SagaIterator {
    while (true) {
        const action = yield take(lcpActions.ActionType.UserKeyCheckRequest);

        // FIXME
        if (passhphraseOk) {
            yield put({
                type: lcpActions.ActionType.UserKeyCheckSuccess,
            });
        } else {
            yield put({
                type: lcpActions.ActionType.UserKeyCheckError,
                error: true,
            });
        }
    }
}
