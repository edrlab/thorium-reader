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
import { toastActions } from "readium-desktop/common/redux/actions/";
import { callTyped, selectTyped, takeTyped } from "readium-desktop/common/redux/typed-saga";
import { PublicationDocument } from "readium-desktop/main/db/document/publication";
import { diMainGet } from "readium-desktop/main/di";
import { lcpActions, streamerActions } from "readium-desktop/main/redux/actions";
import { RootState } from "readium-desktop/main/redux/states";
import { SagaIterator } from "redux-saga";
import { all, call, put, take } from "redux-saga/effects";

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
        yield take(streamerActions.startRequest.ID);
        const streamer = diMainGet("streamer");

        try {
            const streamerUrl = yield* callTyped(() => startStreamer(streamer));
            yield put(streamerActions.startSuccess.build(streamerUrl));
        } catch (error) {
            debug("Unable to start streamer");
            yield put(streamerActions.startError.build(error));
        }
    }
}

export function* stopRequestWatcher(): SagaIterator {
    while (true) {
        yield take(streamerActions.stopRequest.ID);
        const streamer = diMainGet("streamer");

        try {
            yield call(() => stopStreamer(streamer));
            yield put(streamerActions.stopSuccess.build());
        } catch (error) {
            debug("Unable to stop streamer");
            yield put(streamerActions.stopError.build(error));
        }
    }
}

export function* publicationOpenRequestWatcher(): SagaIterator {
    while (true) {
        // tslint:disable-next-line: max-line-length
        const action = yield* takeTyped(streamerActions.publicationOpenRequest.build);

        const publicationRepository = diMainGet("publication-repository");

        // Get publication
        let publicationDocument: PublicationDocument = null;
        try {
            // tslint:disable-next-line: max-line-length
            publicationDocument = yield* callTyped(() => publicationRepository.get(action.payload.publicationIdentifier));
        } catch (error) {
            yield put(streamerActions.publicationOpenError.build(error, publicationDocument));
            continue;
        }

        const publicationFileLocks = yield* selectTyped((s: RootState) => s.app.publicationFileLocks);

        if (publicationFileLocks[action.payload.publicationIdentifier]) {
            yield put(streamerActions.publicationOpenError.build(new Error(""), publicationDocument));
            continue;
        }
        // no need to lock here, because once the streamer server accesses the ZIP file and streams resources,
        // it's like a giant no-go to inject LCP license (which is why readers are closed before LSD updates)
        // also, checkPublicationLicenseUpdate() places a lock or simply skips LSD checks (see below)
        // yield put(appActions.publicationFileLock.build({ [publicationDocument.identifier]: true }));
        // try {
        // } finally {
        //     yield put(appActions.publicationFileLock.build({ [publicationDocument.identifier]: false }));
        // }

        const translator = diMainGet("translator");
        const lcpManager = diMainGet("lcp-manager");
        const publicationViewConverter = diMainGet("publication-view-converter");

        if (publicationDocument.lcp) {
            try {
                publicationDocument = yield* callTyped(
                    () => lcpManager.checkPublicationLicenseUpdate(publicationDocument),
                );
            } catch (error) {
                debug(error);
            }

            if (publicationDocument.lcp && publicationDocument.lcp.lsd && publicationDocument.lcp.lsd.lsdStatus &&
                publicationDocument.lcp.lsd.lsdStatus.status &&
                publicationDocument.lcp.lsd.lsdStatus.status !== StatusEnum.Ready &&
                publicationDocument.lcp.lsd.lsdStatus.status !== StatusEnum.Active) {

                const msg = publicationDocument.lcp.lsd.lsdStatus.status === StatusEnum.Expired ?
                    translator.translate("publication.expiredLcp") : (
                    publicationDocument.lcp.lsd.lsdStatus.status === StatusEnum.Revoked ?
                    translator.translate("publication.revokedLcp") : (
                    publicationDocument.lcp.lsd.lsdStatus.status === StatusEnum.Cancelled ?
                    translator.translate("publication.cancelledLcp") : (
                    publicationDocument.lcp.lsd.lsdStatus.status === StatusEnum.Returned ?
                    translator.translate("publication.returnedLcp") :
                    translator.translate("publication.expiredLcp")
                    )));

                yield put(toastActions.openRequest.build(ToastType.Error, msg));

                yield put(streamerActions.publicationOpenError.build(msg, publicationDocument));
                continue;
            }

            // we first unlockPublication() for the transient in-memory R2Publication,
            // then we have to unlockPublication() again for the streamer-hosted pub instance (see below)
            try {
                // TODO: improve this horrible returned union type!
                const unlockPublicationRes: string | number | null | undefined =
                    yield* callTyped(() => lcpManager.unlockPublication(publicationDocument, undefined));

                if (typeof unlockPublicationRes !== "undefined") {
                    const message = unlockPublicationRes === 11 ?
                        translator.translate("publication.expiredLcp") :
                        lcpManager.convertUnlockPublicationResultToString(unlockPublicationRes);
                    debug(message);

                    try {
                        const publicationView = publicationViewConverter.convertDocumentToView(publicationDocument);

                        // will call API.unlockPublicationWithPassphrase()
                        yield put(lcpActions.userKeyCheckRequest.build(
                            publicationView,
                            publicationView.lcp.textHint,
                            message,
                        ));

                        yield put(streamerActions.publicationOpenError.build(message, publicationDocument));
                        continue;
                    } catch (error) {
                        debug(error);

                        yield put(streamerActions.publicationOpenError.build(error, publicationDocument));
                        continue;
                    }
                }
            } catch (error) {
                debug(error);

                yield put(streamerActions.publicationOpenError.build(error, publicationDocument));
                continue;
            }
        }

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
            yield put(streamerActions.startRequest.build());

            // Wait for streamer
            const streamerStartAction = yield take([
                streamerActions.startSuccess.ID,
                streamerActions.startError.ID,
            ]);
            const typedAction = streamerStartAction.error ?
                streamerStartAction as streamerActions.startSuccess.TAction :
                streamerStartAction as streamerActions.startError.TAction;

            if (typedAction.error) {
                // Unable to start server
                yield put(streamerActions.publicationOpenError.build(typedAction.payload, publicationDocument));
                continue;
            }
        }

        const manifestPaths = streamer.addPublications([epubPath]);

        let r2Publication: R2Publication;
        try {
            r2Publication = yield* callTyped(
                () => streamer.loadOrGetCachedPublication(epubPath),
            );
        } catch (error) {
            yield put(streamerActions.publicationOpenError.build(error, publicationDocument));
            continue;
        }

        // we unlockPublication() again because previously only done on transient in-memory R2Publication,
        // (see above), has not been done yet on streamer-hosted publication instance.
        // Consequently, unlockPublicationRes should always be undefined (valid passphrase already obtained)
        if (r2Publication.LCP) {
            try {
                // TODO: improve this horrible returned union type!
                const unlockPublicationRes: string | number | null | undefined =
                    yield* callTyped(() => lcpManager.unlockPublication(publicationDocument, undefined));

                if (typeof unlockPublicationRes !== "undefined") {
                    const message = unlockPublicationRes === 11 ?
                        translator.translate("publication.expiredLcp") :
                        lcpManager.convertUnlockPublicationResultToString(unlockPublicationRes);
                    debug(message);

                    try {
                        const publicationView = publicationViewConverter.convertDocumentToView(publicationDocument);

                        // will call API.unlockPublicationWithPassphrase()
                        yield put(lcpActions.userKeyCheckRequest.build(
                            publicationView,
                            r2Publication.LCP.Encryption.UserKey.TextHint,
                            message,
                        ));

                        yield put(streamerActions.publicationOpenError.build(message, publicationDocument));
                        continue;
                    } catch (error) {
                        debug(error);

                        yield put(streamerActions.publicationOpenError.build(error, publicationDocument));
                        continue;
                    }
                }
            } catch (error) {
                debug(error);

                yield put(streamerActions.publicationOpenError.build(error, publicationDocument));
                continue;
            }
        }

        const manifestUrl = streamer.serverUrl() + manifestPaths[0];
        debug(manifestUrl);
        yield put(streamerActions.publicationOpenSuccess.build(publicationDocument, manifestUrl));
    }
}

export function* publicationCloseRequestWatcher(): SagaIterator {
    while (true) {
        // tslint:disable-next-line: max-line-length
        const action = yield* takeTyped(streamerActions.publicationCloseRequest.build);

        const publicationRepository = diMainGet("publication-repository");

        let publicationDocument: PublicationDocument = null;
        try {
            publicationDocument =
                yield* callTyped(() => publicationRepository.get(action.payload.publicationIdentifier));
        } catch (error) {
            continue;
        }

        // will decrement on streamerActions.publicationCloseSuccess.build (see below)
        const counter =  yield* selectTyped((s: RootState) => s.streamer.openPublicationCounter);
        const streamer = diMainGet("streamer");
        const pubStorage = diMainGet("publication-storage");

        let wasKilled = false;
        if (!counter.hasOwnProperty(publicationDocument.identifier) || counter[publicationDocument.identifier] <= 1) {
            wasKilled = true;

            // Remove publication from streamer because there is no more readers
            // open for this publication
            // Get epub file from publication
            const epubPath = pubStorage.getPublicationEpubPath(publicationDocument.identifier);
            // const epubPath = path.join(
            //     pubStorage.getRootPath(),
            //     publicationDocument.files[0].url.substr(6),
            // );
            debug(`EPUB ZIP CLEANUP: ${epubPath}`);
            streamer.removePublications([epubPath]);
        }

        const pubIds = Object.keys(counter);
        let l = pubIds.length;
        if (wasKilled && pubIds.includes(publicationDocument.identifier)) {
            l--;
        }
        if (l <= 0) {
            debug("STREAMER SHUTDOWN");
            yield put(streamerActions.stopRequest.build());
        }

        // will decrement state.streamer.openPublicationCounter
        yield put(streamerActions.publicationCloseSuccess.build(publicationDocument));
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
