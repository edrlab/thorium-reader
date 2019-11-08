// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import * as portfinder from "portfinder";
import { Action } from "readium-desktop/common/models/redux";
import { StreamerStatus } from "readium-desktop/common/models/streamer";
import { ToastType } from "readium-desktop/common/models/toast";
import { toastActions } from "readium-desktop/common/redux/actions/";
import { callTyped, selectTyped } from "readium-desktop/common/redux/typed-saga";
import { PublicationDocument } from "readium-desktop/main/db/document/publication";
import { diMainGet } from "readium-desktop/main/di";
import { lcpActions, streamerActions } from "readium-desktop/main/redux/actions";
import { RootState } from "readium-desktop/main/redux/states";
import { SagaIterator } from "redux-saga";
import { all, call, put, take } from "redux-saga/effects";

import { StatusEnum } from "@r2-lcp-js/parser/epub/lsd";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";
import { Server } from "@r2-streamer-js/http/server";

import {
    ActionPayloadStreamer, ActionPayloadStreamerPublicationCloseSuccess,
    ActionPayloadStreamerPublicationOpenSuccess, ActionPayloadStreamerStartSuccess,
} from "../actions/streamer";

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
            const streamerUrl = yield* callTyped(() => startStreamer(streamer));
            yield put({
                type: streamerActions.ActionType.StartSuccess,
                payload: {
                    streamerUrl,
                },
            } as Action<string, ActionPayloadStreamerStartSuccess>);
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
        // tslint:disable-next-line: max-line-length
        const action: Action<string, ActionPayloadStreamer> = yield take(streamerActions.ActionType.PublicationOpenRequest);

        const publicationRepository = diMainGet("publication-repository");

        // Get publication
        let publicationDocument: PublicationDocument = null;
        try {
            // tslint:disable-next-line: max-line-length
            publicationDocument = yield* callTyped(() => publicationRepository.get(action.payload.publicationIdentifier));
        } catch (error) {
            yield put({
                type: streamerActions.ActionType.PublicationOpenError,
                // payload: {
                //     error,
                // },
                error: true,
                meta: {
                    publicationDocument, // undefined
                },
            });
            continue;
        }

        const translator = diMainGet("translator");
        const lcpManager = diMainGet("lcp-manager");

        if (publicationDocument.lcp) {
            try {
                publicationDocument = yield* callTyped(
                    () => lcpManager.checkPublicationLicenseUpdate(publicationDocument),
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

            if (publicationDocument.lcp && publicationDocument.lcp.lsd && publicationDocument.lcp.lsd.lsdStatus &&
                publicationDocument.lcp.lsd.lsdStatus.status &&
                publicationDocument.lcp.lsd.lsdStatus.status !== StatusEnum.Ready &&
                publicationDocument.lcp.lsd.lsdStatus.status !== StatusEnum.Active) {

                const msg = publicationDocument.lcp.lsd.lsdStatus.status === StatusEnum.Expired ?
                    translator.translate("publication.expiredLcp") : (
                    publicationDocument.lcp.lsd.lsdStatus.status === StatusEnum.Revoked ?
                    translator.translate("publication.revokedLcp") : (
                    publicationDocument.lcp.lsd.lsdStatus.status === StatusEnum.Returned ?
                    translator.translate("publication.returnedLcp") :
                    translator.translate("publication.expiredLcp") // StatusEnum.Cancelled
                    ));

                yield put(toastActions.openRequest.build(ToastType.DownloadFailed, msg));

                yield put({
                    type: streamerActions.ActionType.PublicationOpenError,
                    // payload: {
                    //     error,
                    // },
                    error: true,
                    meta: {
                        publicationDocument,
                    },
                });
                continue;
            }
        }

        // Get epub file from publication
        const pubStorage = diMainGet("publication-storage");
        const epubPath = pubStorage.getPublicationEpubPath(publicationDocument.identifier);
        // const epubPath = path.join(
        //     pubStorage.getRootPath(),
        //     publicationDocument.files[0].url.substr(6),
        // );
        debug("Open publication %s", epubPath);

        // Start streamer if it's not already started
        const status = yield* selectTyped((s: RootState) => s.streamer.status);
        const streamer = diMainGet("streamer");

        if (status === StreamerStatus.Stopped) {
            // Streamer is stopped, start it
            yield put(streamerActions.start());

            // Wait for streamer
            const streamerStartAction: Action<string, ActionPayloadStreamerStartSuccess> = yield take([
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
                        publicationDocument,
                    },
                });
                continue;
            }
        }

        // Load epub in streamer
        const manifestPaths = streamer.addPublications([epubPath]);

        let r2Publication: R2Publication;
        try {
            r2Publication = yield* callTyped(
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
                    publicationDocument,
                },
            });
            continue;
        }

        if (r2Publication.LCP) {
            debug("### LCP publication");

            const publicationViewConverter = diMainGet("publication-view-converter");
            const publicationView = publicationViewConverter.convertDocumentToView(publicationDocument);

            try {
                const unlockPublicationRes: string | number | null | undefined =
                    yield* callTyped(() => lcpManager.unlockPublication(publicationDocument.identifier, undefined));

                if (typeof unlockPublicationRes !== "undefined") {
                    const message = unlockPublicationRes === 11 ?
                        translator.translate("publication.expiredLcp") :
                        lcpManager.convertUnlockPublicationResultToString(unlockPublicationRes);
                    debug(message);

                    try {
                        yield put(lcpActions.userKeyCheckRequest.build(
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
                                publicationDocument,
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
                                publicationDocument,
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
                        publicationDocument,
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
                publicationDocument,
                manifestUrl,
            },
        } as Action<string, ActionPayloadStreamerPublicationOpenSuccess>);
    }
}

export function* publicationCloseRequestWatcher(): SagaIterator {
    while (true) {
        // tslint:disable-next-line: max-line-length
        const action: Action<string, ActionPayloadStreamer> = yield take(streamerActions.ActionType.PublicationCloseRequest);

        const publicationRepository = diMainGet("publication-repository");

        // Get publication
        let publicationDocument: PublicationDocument = null;

        try {
            publicationDocument =
                yield* callTyped(() => publicationRepository.get(action.payload.publicationIdentifier));
        } catch (error) {
            continue;
        }

        const counter =  yield* selectTyped((s: RootState) => s.streamer.openPublicationCounter);
        const streamer = diMainGet("streamer");
        const pubStorage = diMainGet("publication-storage");

        if (!counter.hasOwnProperty(publicationDocument.identifier)) {
            // Remove publication from streamer because there is no more readers
            // open for this publication
            // Get epub file from publication
            const epubPath = pubStorage.getPublicationEpubPath(publicationDocument.identifier);
            // const epubPath = path.join(
            //     pubStorage.getRootPath(),
            //     publicationDocument.files[0].url.substr(6),
            // );
            streamer.removePublications([epubPath]);
        }

        if (Object.keys(counter).length === 0) {
            yield put(streamerActions.stop());
        }

        yield put({
            type: streamerActions.ActionType.PublicationCloseSuccess,
            payload: {
                publicationDocument,
            },
        } as Action<string, ActionPayloadStreamerPublicationCloseSuccess>);
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
