// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import * as portfinder from "portfinder";
import { error } from "readium-desktop/common/error";
import { StreamerStatus } from "readium-desktop/common/models/streamer";
import { ToastType } from "readium-desktop/common/models/toast";
import { lcpActions, toastActions } from "readium-desktop/common/redux/actions/";
import { callTyped, selectTyped } from "readium-desktop/common/redux/sagas/typed-saga";
import { PublicationDocument } from "readium-desktop/main/db/document/publication";
import { diMainGet } from "readium-desktop/main/di";
import { streamerActions } from "readium-desktop/main/redux/actions";
import { RootState } from "readium-desktop/main/redux/states";
import { SagaIterator } from "redux-saga";
import { all, call, put, take, takeEvery, takeLeading } from "redux-saga/effects";

import { StatusEnum } from "@r2-lcp-js/parser/epub/lsd";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";
import { Server } from "@r2-streamer-js/http/server";

// Logger
const filename_ = "readium-desktop:main:redux:sagas:streamer";
const debug = debug_(filename_);

async function startStreamer(streamer: Server): Promise<string> {
    // Find a free port on your local machine
    const port = await portfinder.getPortPromise();
    // HTTPS, see secureSessions()
    await streamer.start(port, true);

    const streamerUrl = streamer.serverUrl();
    debug("Streamer started on %s", streamerUrl);

    return streamerUrl;
}

function* startRequest(): SagaIterator {
    const streamer = diMainGet("streamer");

    try {

        const streamerUrl = yield* callTyped(() => startStreamer(streamer));
        yield put(streamerActions.startSuccess.build(streamerUrl));
    } catch (error) {

        debug("Unable to start streamer", error);
        yield put(streamerActions.startError.build(error));
    }
}

function* stopRequest(): SagaIterator {

    const streamer = diMainGet("streamer");

    try {

        yield call(() => streamer.stop());
        yield put(streamerActions.stopSuccess.build());
    } catch (error) {

        debug("Unable to stop streamer", error);
        yield put(streamerActions.stopError.build(error));
    }
}

function* publicationCloseRequest(action: streamerActions.publicationCloseRequest.TAction) {

    const pubId = action.payload.publicationIdentifier;
    // will decrement on streamerActions.publicationCloseSuccess.build (see below)
    const counter = yield* selectTyped((s: RootState) => s.streamer.openPublicationCounter);
    const streamer = diMainGet("streamer");
    const pubStorage = diMainGet("publication-storage");

    let wasKilled = false;
    if (!counter.hasOwnProperty(pubId) || counter[pubId] <= 1) {
        wasKilled = true;

        // Remove publication from streamer because there is no more readers
        // open for this publication
        // Get epub file from publication
        const epubPath = pubStorage.getPublicationEpubPath(pubId);
        // const epubPath = path.join(
        //     pubStorage.getRootPath(),
        //     publicationDocument.files[0].url.substr(6),
        // );
        debug(`EPUB ZIP CLEANUP: ${epubPath}`);
        streamer.removePublications([epubPath]);
    }

    const pubIds = Object.keys(counter);
    let l = pubIds.length;
    if (wasKilled && pubIds.includes(pubId)) {
        l--;
    }
    if (l <= 0) {
        debug("STREAMER SHUTDOWN");
        yield put(streamerActions.stopRequest.build());
    }

    // will decrement state.streamer.openPublicationCounter
    yield put(streamerActions.publicationCloseSuccess.build(pubId));
}

function* publicationCloseRequestWatcher() {
    try {
        yield all([
            yield takeEvery(streamerActions.publicationCloseRequest.ID, publicationCloseRequest),
        ]);
    } catch (err) {
        error(filename_ + ":publicationCloseRequestWatcher", err);
    }
}

function* stopRequestWatcher() {
    try {
        yield all([
            yield takeLeading(streamerActions.stopRequest.ID, stopRequest),
        ]);
    } catch (err) {
        error(filename_ + ":stopRequestWatcher", err);
    }
}

function* startRequestWatcher() {
    try {
        yield all([
            yield takeLeading(streamerActions.startRequest.ID, startRequest),
        ]);
    } catch (err) {
        error(filename_ + ":startRequestWatcher", err);
    }
}

export function* watchers() {
    yield all([
        call(stopRequestWatcher),
        call(startRequestWatcher),
        call(publicationCloseRequestWatcher),
    ]);
}

export function* streamerOpenPublicationAndReturnManifestUrl(pubId: string) {

    const publicationRepository = diMainGet("publication-repository");

    // Get publication
    let publicationDocument: PublicationDocument = null;
    try {
        // tslint:disable-next-line: max-line-length
        publicationDocument = yield* callTyped(() => publicationRepository.get(pubId));
    } catch (error) {
        throw error;
    }

    const publicationFileLocks = yield* selectTyped((s: RootState) => s.lcp.publicationFileLocks);

    if (publicationFileLocks[pubId]) {
        throw error;
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
            debug("ERROR on call lcpManager.checkPublicationLicenseUpdate", error);
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

            throw new Error(msg);
        }

        // we first unlockPublication() for the transient in-memory R2Publication,
        // then we have to unlockPublication() again for the streamer-hosted pub instance (see below)
        try {
            // TODO: improve this horrible returned union type!
            const unlockPublicationRes: string | number | null | undefined =
                yield* callTyped(() => lcpManager.unlockPublication(publicationDocument, undefined));

            if (typeof unlockPublicationRes !== "undefined") {
                const message = unlockPublicationRes === 11
                    ? translator.translate("publication.expiredLcp")
                    : lcpManager.convertUnlockPublicationResultToString(unlockPublicationRes);

                try {
                    const publicationView = publicationViewConverter.convertDocumentToView(publicationDocument);

                    // will call API.unlockPublicationWithPassphrase()
                    yield put(lcpActions.userKeyCheckRequest.build(
                        publicationView,
                        publicationView.lcp.textHint,
                        message,
                    ));

                    throw new Error(message);
                } catch (error) {

                    throw error;
                }
            }
        } catch (error) {

            throw error;
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
            const err = "Unable to start server";

            throw new Error(err);
        }
    }

    const manifestPaths = streamer.addPublications([epubPath]);

    let r2Publication: R2Publication;
    try {
        r2Publication = yield* callTyped(
            () => streamer.loadOrGetCachedPublication(epubPath),
        );
    } catch (error) {

        throw error;
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

                    throw new Error(message);
                } catch (error) {

                    throw error;
                }
            }
        } catch (error) {

            throw error;
        }
    }

    const manifestUrl = streamer.serverUrl() + manifestPaths[0];
    debug(pubId, " streamed on ", manifestUrl);

    // add in reducer
    yield put(streamerActions.publicationOpenSuccess.build(pubId, manifestUrl));

    return manifestUrl;
}
