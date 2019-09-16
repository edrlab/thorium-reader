// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import * as path from "path";
import * as portfinder from "portfinder";
import { DialogType } from "readium-desktop/common/models/dialog";
import { StreamerStatus } from "readium-desktop/common/models/streamer";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import { PublicationDocument } from "readium-desktop/main/db/document/publication";
import { diMainGet } from "readium-desktop/main/di";
import { lcpActions, streamerActions } from "readium-desktop/main/redux/actions";
import { RootState } from "readium-desktop/main/redux/states";
import { SagaIterator } from "redux-saga";
import { all, call, put, select, take } from "redux-saga/effects";

import { Server } from "@r2-streamer-js/http/server";

// Logger
const debug = debug_("readium-desktop:main:redux:sagas:streamer");

async function startStreamer(streamer: Server): Promise<string> {
    // Find a free port on your local machine
    return portfinder.getPortPromise()
        .then(async (port) => {
            // HTTPS, see secureSessions()
            await streamer.start(port, true);

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

export function* startRequestWatcher(): SagaIterator {
    while (true) {
        yield take(streamerActions.ActionType.StartRequest);
        const streamer = diMainGet("streamer");

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

export function* stopRequestWatcher(): SagaIterator {
    while (true) {
        yield take(streamerActions.ActionType.StopRequest);
        const streamer = diMainGet("streamer");

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

export function* publicationOpenRequestWatcher(): SagaIterator {
    while (true) {
        const action: any = yield take(streamerActions.ActionType.PublicationOpenRequest);
        const publicationRepository = diMainGet("publication-repository");
        const publicationViewConverter = diMainGet("publication-view-converter");
        const lcpManager = diMainGet("lcp-manager");

        // Get publication
        let publication: PublicationDocument = null;

        try {
            publication = yield call(
                publicationRepository.get.bind(publicationRepository),
                action.payload.publication.identifier,
            );
        } catch (error) {
            continue;
        }
        const publicationView = publicationViewConverter.convertDocumentToView(publication);

        // Get epub file from publication
        const pubStorage = diMainGet("publication-storage");
        const epubPath = path.join(
            pubStorage.getRootPath(),
            publication.files[0].url.substr(6),
        );
        debug("Open publication %s", epubPath);

        // Start streamer if it's not already started
        const state: RootState =  yield select();
        const streamer = diMainGet("streamer");

        if (state.streamer.status === StreamerStatus.Stopped) {
            // Streamer is stopped, start it
            yield put(streamerActions.start());

            // Wait for streamer
            const streamerStartAction: any = yield take([
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

        let parsedEpub: any;
        try {
            // Test if publication contains LCP drm
            parsedEpub = yield call(
                () => streamer.loadOrGetCachedPublication(epubPath),
            );
        } catch (error) {
            yield put({
                type: streamerActions.ActionType.PublicationOpenError,
                error: true,
                meta: {
                    publication,
                },
            });
            continue;
        }

        if (parsedEpub.LCP) {
            debug("### LCP publication");
            // Test existing secrets on the given publication
            try {
                yield call(
                    lcpManager.unlockPublication.bind(lcpManager),
                    publication as any,
                );
            } catch (error) {
                // Get lsd status
                try {
                    publication = yield call(
                        publicationRepository.get.bind(publicationRepository),
                        action.payload.publication.identifier,
                    );

                    const lsdStatus: any = yield call(
                        lcpManager.getLsdStatus.bind(lcpManager),
                        publication,
                    );

                    if (
                        lsdStatus.status === "active" ||
                        lsdStatus.status === "ready"
                    ) {
                        // Publication is protected and is not expired
                        yield put(lcpActions.checkUserKey(
                            publicationView,
                            parsedEpub.LCP.Encryption.UserKey.TextHint,
                        ));
                    } else {
                        yield put(dialogActions.open("publication-info",
                            {
                                publicationIdentifier: publication.identifier,
                            },
                        ));
                    }
                } catch (error) {
                    console.error(error);
                }

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

export function* publicationCloseRequestWatcher(): SagaIterator {
    while (true) {
        const action: any = yield take(streamerActions.ActionType.PublicationCloseRequest);
        const publicationRepository = diMainGet("publication-repository");

        // Get publication
        let publication: PublicationDocument = null;

        try {
            publication = yield call(
                publicationRepository.get.bind(publicationRepository),
                action.payload.publication.identifier,
            );
        } catch (error) {
            continue;
        }

        const state: RootState =  yield select();
        const streamer = diMainGet("streamer");
        const pubStorage = diMainGet("publication-storage");

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

        yield put({
            type: streamerActions.ActionType.PublicationCloseSuccess,
            payload: {
                publication,
            },
        });
    }
}

export function* watchers() {
    yield all([
        call(stopRequestWatcher),
        call(startRequestWatcher),
        call(publicationOpenRequestWatcher),
        call(publicationCloseRequestWatcher),
    ]);
}
