// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { Action } from "readium-desktop/common/models/redux";
import { StreamerStatus } from "readium-desktop/common/models/streamer";
import { lcpActions } from "readium-desktop/common/redux/actions/";
import { PublicationDocument } from "readium-desktop/main/db/document/publication";
import { diMainGet } from "readium-desktop/main/di";
import { streamerActions } from "readium-desktop/main/redux/actions";
import { RootState } from "readium-desktop/main/redux/states";
import {
    streamerAddPublications, streamerLoadOrGetCachedPublication,
    THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL,
} from "readium-desktop/main/streamer/streamerNoHttp";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { put, take } from "redux-saga/effects";
import { call as callTyped, select as selectTyped } from "typed-redux-saga/macro";

import { StatusEnum } from "@r2-lcp-js/parser/epub/lsd";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";
import { PublicationViewConverter } from "readium-desktop/main/converter/publication";
import { getTranslator } from "readium-desktop/common/services/translator";

// import { _USE_HTTP_STREAMER } from "readium-desktop/preprocessor-directives";

// Logger
const filename_ = "readium-desktop:main:redux:sagas:publication:open";
const debug = debug_(filename_);

export const ERROR_MESSAGE_ON_USERKEYCHECKREQUEST = "ERROR_MESSAGE_ON_USERKEYCHECKREQUEST";

const convertDoc = async (doc: PublicationDocument, publicationViewConverter: PublicationViewConverter) => {
    return await publicationViewConverter.convertDocumentToView(doc);
};

export function* streamerOpenPublicationAndReturnManifestUrl(pubId: string) {

    const publicationRepository = yield* callTyped(
        () => diMainGet("publication-repository"));
    const translator = getTranslator();

    // Get publication
    let publicationDocument: PublicationDocument = null;
    publicationDocument = yield* callTyped(
        () => publicationRepository.get(pubId));

    const publicationFileLocks = yield* selectTyped(
        (s: RootState) => s.lcp.publicationFileLocks);

    if (publicationFileLocks[pubId]) {
        throw new Error("lcp publication locked");
    }
    // no need to lock here, because once the streamer server accesses the ZIP file and streams resources,
    // it's like a giant no-go to inject LCP license (which is why readers are closed before LSD updates)
    // also, checkPublicationLicenseUpdate() places a lock or simply skips LSD checks (see below)
    // yield put(appActions.publicationFileLock.build({ [publicationDocument.identifier]: true }));
    // try {
    // } finally {
    //     yield put(appActions.publicationFileLock.build({ [publicationDocument.identifier]: false }));
    // }

    const lcpManager = yield* callTyped(
        () => diMainGet("lcp-manager"));
    const publicationViewConverter = yield* callTyped(
        () => diMainGet("publication-view-converter"));

    if (publicationDocument.lcp) {
        try {
            publicationDocument = yield* callTyped(
                () => lcpManager.checkPublicationLicenseUpdate(publicationDocument),
            );
        } catch (error) {
            debug("ERROR on call lcpManager.checkPublicationLicenseUpdate", error);
        }

        if (
            publicationDocument.lcp && publicationDocument.lcp.lsd && publicationDocument.lcp.lsd.lsdStatus &&
            publicationDocument.lcp.lsd.lsdStatus.status &&
            publicationDocument.lcp.lsd.lsdStatus.status !== StatusEnum.Ready &&
            publicationDocument.lcp.lsd.lsdStatus.status !== StatusEnum.Active
        ) {

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

            throw new Error(msg);
        }

        // we first unlockPublication() for the transient in-memory R2Publication,
        // then we have to unlockPublication() again for the streamer-hosted pub instance (see below)
        try {
            // TODO: improve this horrible returned union type!
            const unlockPublicationRes: string | number | null | undefined =
                yield* callTyped(() => lcpManager.unlockPublication(publicationDocument, undefined));

            if (typeof unlockPublicationRes !== "undefined") {
                const message =
                    // unlockPublicationRes === 11
                    // ? translator.translate("publication.expiredLcp") :
                    lcpManager.convertUnlockPublicationResultToString(unlockPublicationRes);

                try {
                    const publicationView = yield* callTyped(() => convertDoc(publicationDocument, publicationViewConverter));

                    // will call API.unlockPublicationWithPassphrase()
                    yield put(lcpActions.userKeyCheckRequest.build(
                        publicationView,
                        publicationView.lcp.textHint,
                        publicationView.lcp.urlHint,
                        message,
                    ));

                    throw ERROR_MESSAGE_ON_USERKEYCHECKREQUEST;
                } catch (error) {

                    throw error;
                }
            }
        } catch (error) {

            throw error;
        }
    }

    const pubStorage = yield* callTyped(() => diMainGet("publication-storage"));
    const epubPath = pubStorage.getPublicationEpubPath(publicationDocument.identifier);
    // const epubPath = path.join(
    //     pubStorage.getRootPath(),
    //     publicationDocument.files[0].url.substr(6),
    // );
    debug("Open publication %s", epubPath);

    // Start streamer if it's not already started
    const status = yield* selectTyped((s: RootState) => s.streamer.status);

    // const streamer = _USE_HTTP_STREAMER ? yield* callTyped(() => diMainGet("streamer")) : undefined;

    if (status === StreamerStatus.Stopped) {
        // Streamer is stopped, start it
        yield put(streamerActions.startRequest.build());

        // Wait for streamer
        const streamerStartAction: Action<any> = yield take([
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

    // const manifestPaths = _USE_HTTP_STREAMER ?
    //     streamer.addPublications([epubPath]) :
    //     streamerAddPublications([epubPath]);
    const manifestPaths = streamerAddPublications([epubPath]);

    let r2Publication: R2Publication;
    try {
        // if (_USE_HTTP_STREAMER) {
        //     r2Publication = yield* callTyped(() => streamer.loadOrGetCachedPublication(epubPath));
        // } else {
        //     r2Publication = yield* callTyped(() => streamerLoadOrGetCachedPublication(epubPath));
        // }
        r2Publication = yield* callTyped(() => streamerLoadOrGetCachedPublication(epubPath));
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
                const message =
                    // unlockPublicationRes === 11 ?
                    // translator.translate("publication.expiredLcp") :
                    lcpManager.convertUnlockPublicationResultToString(unlockPublicationRes);
                debug(message);

                try {
                    const publicationView = yield* callTyped(() => convertDoc(publicationDocument, publicationViewConverter));

                    // will call API.unlockPublicationWithPassphrase()
                    yield put(lcpActions.userKeyCheckRequest.build(
                        publicationView,
                        r2Publication.LCP.Encryption.UserKey.TextHint,
                        {
                            href: r2Publication.LCP?.Links?.find((l) => l.Rel === "hint")?.Href,
                        },
                        message,
                    ));

                    throw ERROR_MESSAGE_ON_USERKEYCHECKREQUEST;
                } catch (error) {

                    throw error;
                }
            }
        } catch (error) {

            throw error;
        }
    }

    // const manifestUrl = _USE_HTTP_STREAMER ?
    //     streamer.serverUrl() + manifestPaths[0] :
    //     `${THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL}://0.0.0.0${manifestPaths[0]}`;
    const manifestUrl = `${THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL}://0.0.0.0${manifestPaths[0]}`;

    debug(pubId, " streamed on ", manifestUrl);

    // add in reducer
    yield put(streamerActions.publicationOpenSuccess.build(pubId, manifestUrl));

    return manifestUrl;
}
