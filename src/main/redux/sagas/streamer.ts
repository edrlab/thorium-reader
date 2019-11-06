// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import * as portfinder from "portfinder";
import { StreamerStatus } from "readium-desktop/common/models/streamer";
import { ToastType } from "readium-desktop/common/models/toast";
import { open } from "readium-desktop/common/redux/actions/toast";
import { PublicationDocument } from "readium-desktop/main/db/document/publication";
import { diMainGet } from "readium-desktop/main/di";
import { lcpActions, streamerActions } from "readium-desktop/main/redux/actions";
import { RootState } from "readium-desktop/main/redux/states";
import { SagaIterator } from "redux-saga";
import { all, call, put, select, take } from "redux-saga/effects";

import { StatusEnum } from "@r2-lcp-js/parser/epub/lsd";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";
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

        // Get publication
        let publication: PublicationDocument = null;
        try {
            publication = yield call(
                publicationRepository.get.bind(publicationRepository),
                action.payload.publication.identifier,
            );
        } catch (error) {
            yield put({
                type: streamerActions.ActionType.PublicationOpenError,
                // payload: {
                //     error,
                // },
                error: true,
                meta: {
                    publication, // undefined
                },
            });
            continue;
        }

        const translator = diMainGet("translator");
        const lcpManager = diMainGet("lcp-manager");

        if (publication.lcp) {
            try {
                publication = yield call(
                    () => lcpManager.checkPublicationLicenseUpdate(publication),
                );
            } catch (error) {
                debug(error);
                // yield put({
                //     type: streamerActions.ActionType.PublicationOpenError,
                //     // payload: {
                //     //     error,
                //     // },
                //     error: true,
                //     meta: {
                //         publication,
                //     },
                // });
                // continue;
            }

            if (publication.lcp && publication.lcp.lsd && publication.lcp.lsd.lsdStatus &&
                publication.lcp.lsd.lsdStatus.status &&
                publication.lcp.lsd.lsdStatus.status !== StatusEnum.Ready &&
                publication.lcp.lsd.lsdStatus.status !== StatusEnum.Active) {

                const msg = publication.lcp.lsd.lsdStatus.status === StatusEnum.Expired ?
                    translator.translate("publication.expiredLcp") : (
                    publication.lcp.lsd.lsdStatus.status === StatusEnum.Revoked ?
                    translator.translate("publication.revokedLcp") : (
                    publication.lcp.lsd.lsdStatus.status === StatusEnum.Returned ?
                    translator.translate("publication.returnedLcp") :
                    translator.translate("publication.expiredLcp") // StatusEnum.Cancelled
                    ));

                const store = diMainGet("store");
                store.dispatch(open(ToastType.DownloadFailed, msg));

                yield put({
                    type: streamerActions.ActionType.PublicationOpenError,
                    // payload: {
                    //     error,
                    // },
                    error: true,
                    meta: {
                        publication,
                    },
                });
                continue;
            }
        }

        // Get epub file from publication
        const pubStorage = diMainGet("publication-storage");
        const epubPath = pubStorage.getPublicationEpubPath(publication.identifier);
        // const epubPath = path.join(
        //     pubStorage.getRootPath(),
        //     publication.files[0].url.substr(6),
        // );
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

        let r2Publication: R2Publication;
        try {
            r2Publication = yield call(
                () => streamer.loadOrGetCachedPublication(epubPath),
            );
        } catch (error) {
            yield put({
                type: streamerActions.ActionType.PublicationOpenError,
                // payload: {
                //     error,
                // },
                error: true,
                meta: {
                    publication,
                },
            });
            continue;
        }

        if (r2Publication.LCP) {
            debug("### LCP publication");

            try {
                const unlockPublicationRes: string | number | null | undefined = yield call(
                    lcpManager.unlockPublication.bind(lcpManager),
                    publication,
                );
                if (typeof unlockPublicationRes !== "undefined") {
                    const message = unlockPublicationRes === 11 ?
                        translator.translate("publication.expiredLcp") :
                        lcpManager.convertUnlockPublicationResultToString(unlockPublicationRes);
                    debug(message);

                    const publicationViewConverter = diMainGet("publication-view-converter");
                    const publicationView = publicationViewConverter.convertDocumentToView(publication);

                    try {
                        yield put(lcpActions.checkUserKey(
                            publicationView,
                            r2Publication.LCP.Encryption.UserKey.TextHint,
                            message,
                        ));

                        yield put({
                            type: streamerActions.ActionType.PublicationOpenError,
                            // payload: {
                            //     error,
                            // },
                            error: true,
                            meta: {
                                publication,
                            },
                        });
                        continue;
                    } catch (error) {
                        debug(error);

                        yield put({
                            type: streamerActions.ActionType.PublicationOpenError,
                            // payload: {
                            //     error,
                            // },
                            error: true,
                            meta: {
                                publication,
                            },
                        });
                        continue;
                    }
                }
            } catch (error) {
                debug(error);

                yield put({
                    type: streamerActions.ActionType.PublicationOpenError,
                    // payload: {
                    //     error,
                    // },
                    error: true,
                    meta: {
                        publication,
                    },
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
            const epubPath = pubStorage.getPublicationEpubPath(publication.identifier);
            // const epubPath = path.join(
            //     pubStorage.getRootPath(),
            //     publication.files[0].url.substr(6),
            // );
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
