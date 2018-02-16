import * as debug_ from "debug";
import * as path from "path";
import * as portfinder from "portfinder";
import { channel, Channel, SagaIterator } from "redux-saga";
import { call, fork, put, select, take } from "redux-saga/effects";

import { Server } from "@r2-streamer-js/http/server";

import { Publication as Epub } from "@r2-shared-js/models/publication";
import { EpubParsePromise } from "@r2-shared-js/parser/epub";

import { Publication } from "readium-desktop/common/models/publication";
import { StreamerStatus } from "readium-desktop/common/models/streamer";

import { container } from "readium-desktop/main/di";
import { lcpActions, streamerActions } from "readium-desktop/main/redux/actions";
import { RootState } from "readium-desktop/main/redux/states";
import { PublicationStorage } from "readium-desktop/main/storage/publication-storage";

// Logger
const debug = debug_("readium-desktop:main:redux:sagas:streamer");

function startStreamer(streamer: Server): Promise<string> {
    // Find a free port on your local machine
    return portfinder.getPortPromise()
        .then(async (port) => {
            // HTTPS, see secureSessions()
            const streamerInfo = await streamer.start(port, true);
            debug(streamerInfo);

            const streamerUrl = streamer.serverUrl();
            debug("Streamer started on %s", streamerUrl);

            return streamerUrl;
        });
}

function stopStreamer(streamer: Server) {
    // Stop server
    debug("Stop streamer");
    streamer.stop();
}

export function* streamerStartRequestWatcher(): SagaIterator {
    while (true) {
        const action = yield take(streamerActions.ActionType.StartRequest);
        const streamer: Server = container.get("streamer") as Server;

        try {
            const streamerUrl = yield call(() => startStreamer(streamer));
            yield put({
                type: streamerActions.ActionType.StartSuccess,
                payload: {
                    streamerUrl,
                },
            });
        } catch (error) {
            debug("Unable to start streamer");
            yield put({
                type: streamerActions.ActionType.StartError,
                payload: new Error(error),
                error: true,
            });
        }
    }
}

export function* streamerStopRequestWatcher(): SagaIterator {
    while (true) {
        const action = yield take(streamerActions.ActionType.StopRequest);
        const streamer: Server = container.get("streamer") as Server;

        try {
            yield call(() => stopStreamer(streamer));
            yield put({
                type: streamerActions.ActionType.StopSuccess,
            });
        } catch (error) {
            debug("Unable to stop streamer");
            yield put({
                type: streamerActions.ActionType.StopError,
                payload: new Error(error),
                error: true,
            });
        }
    }
}

export function* streamerPublicationOpenRequestWatcher(): SagaIterator {
    while (true) {
        const action = yield take(streamerActions.ActionType.PublicationOpenRequest);
        const publication = action.payload.publication;

        // Get epub file from publication
        const pubStorage = container.get("publication-storage") as PublicationStorage;
        const epubPath = path.join(
            pubStorage.getRootPath(),
            publication.files[0].url.substr(6),
        );
        debug("Open publication %s", epubPath);

        // Start streamer if it's not already started
        const state: RootState =  yield select();
        const streamer: Server = container.get("streamer") as Server;

        if (state.streamer.status === StreamerStatus.Stopped) {
            // Streamer is stopped, start it
            yield put(streamerActions.start());

            // Wait for streamer
            const streamerStartAction = yield take([
                streamerActions.ActionType.StartSuccess,
                streamerActions.ActionType.StartError,
            ]);

            if (streamerStartAction.error) {
                // Unable to start server
                yield put({
                    type: streamerActions.ActionType.PublicationOpenError,
                    payload: streamerStartAction.payload,
                    error: true,
                    meta: {
                        publication,
                    },
                });
                continue;
            }
        }

        // Load epub in streamer
        const manifestPaths = streamer.addPublications([epubPath]);

        // Test if publication contains LCP drm
        const parsedEpub: Epub = yield call(() => EpubParsePromise(epubPath));

        if (parsedEpub.LCP) {
            console.log("####", parsedEpub.LCP.LSDJson);
            // User key check
            yield put(lcpActions.checkUserKey(
                publication,
                parsedEpub.LCP.Encryption.UserKey.TextHint,
            ));

            // Wait for success
            const userKeyCheckAction = yield take([
                lcpActions.ActionType.UserKeyCheckSuccess,
                lcpActions.ActionType.UserKeyCheckError,
            ]);

            if (userKeyCheckAction.error) {
                yield put({
                    type: streamerActions.ActionType.PublicationOpenError,
                    error: true,
                });
                continue;
            }
        }

        const manifestUrl = streamer.serverUrl() + manifestPaths[0];
        debug(manifestUrl);
        yield put({
            type: streamerActions.ActionType.PublicationOpenSuccess,
            payload: {
                publication,
                manifestUrl,
            },
        });
    }
}

export function* streamerPublicationCloseRequestWatcher(): SagaIterator {
    while (true) {
        const action = yield take(streamerActions.ActionType.PublicationCloseRequest);
        const publication = action.payload.publication;

        const state: RootState =  yield select();
        const streamer: Server = container.get("streamer") as Server;
        const pubStorage = container.get("publication-storage") as PublicationStorage;

        if (!state.streamer.openPublicationCounter.hasOwnProperty(publication.identifier)) {
            // Remove publication from streamer because there is no more readers
            // open for this publication
            // Get epub file from publication
            const epubPath = path.join(
                pubStorage.getRootPath(),
                publication.files[0].url.substr(6),
            );
            streamer.removePublications([epubPath]);
        }

        if (Object.keys(state.streamer.openPublicationCounter).length === 0) {
            yield put(streamerActions.stop());
        }
    }
}
