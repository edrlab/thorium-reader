// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { lcpActions, readerActions } from "readium-desktop/common/redux/actions";
import { takeSpawnLeading } from "readium-desktop/common/redux/sagas/takeSpawnLeading";
import { diMainGet } from "readium-desktop/main/di";
import { error } from "readium-desktop/main/tools/error";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { all } from "redux-saga/effects";
import { call as callTyped, put as putTyped } from "typed-redux-saga/macro";

const filename_ = "readium-desktop:main:redux:sagas:lcp";
const debug = debug_(filename_);

function* renewPublicationLicense(action: lcpActions.renewPublicationLicense.TAction) {
    const { publicationIdentifier } = action.payload;
    const publicationRepository = diMainGet("publication-repository");
    const lcpManager = diMainGet("lcp-manager");
    const publicationDocument = yield* callTyped(() => publicationRepository.get(
        publicationIdentifier,
    ));
    yield* callTyped(() => lcpManager.renewPublicationLicense(publicationDocument));
}

function* returnPublication(action: lcpActions.returnPublication.TAction) {
    const { publicationIdentifier } = action.payload;
    const publicationRepository = diMainGet("publication-repository");
    const lcpManager = diMainGet("lcp-manager");
    const publicationDocument = yield* callTyped(() => publicationRepository.get(
        publicationIdentifier,
    ));
    yield* callTyped(() => lcpManager.returnPublication(publicationDocument));
}

function* unlockPublicationWithPassphrase(action: lcpActions.unlockPublicationWithPassphrase.TAction) {
    const { publicationIdentifier, passphrase } = action.payload;
    const publicationRepository = diMainGet("publication-repository");
    const lcpManager = diMainGet("lcp-manager");
    const publicationViewConverter = diMainGet("publication-view-converter");
    const publicationDocument = yield* callTyped(() => publicationRepository.get(
        publicationIdentifier,
    ));

    debug("UnlockPublication", publicationIdentifier, "with", passphrase);
    try {
        // TODO: improve this horrible returned union type!
        const unlockPublicationRes: string | number | null | undefined =
            yield* callTyped(() => lcpManager.unlockPublication(publicationDocument, passphrase));

        debug(unlockPublicationRes, "'undefined' means OKay the publication is decrypted, Well Done !");
        if (typeof unlockPublicationRes !== "undefined") {
            const message =
                // unlockPublicationRes === 11 ?
                // this.translator.translate("publication.expiredLcp") :
                yield* callTyped(() => lcpManager.convertUnlockPublicationResultToString(unlockPublicationRes));
            debug(message);

            // import { TaJsonDeserialize } from "@r2-lcp-js/serializable";
            // import { Publication as R2Publication } from "@r2-shared-js/models/publication";
            // const r2PublicationStr = Buffer.from(publicationView.r2PublicationBase64, "base64").toString("utf-8");
            // const r2PublicationJson = JSON.parse(r2PublicationStr);
            // const r2Publication = TaJsonDeserialize(r2PublicationJson, R2Publication);

            // const epubPath = this.publicationStorage.getPublicationEpubPath(publicationView.identifier);
            // const r2Publication = await this.streamer.loadOrGetCachedPublication(epubPath);

            const publicationView = yield* callTyped(() => publicationViewConverter.convertDocumentToView(publicationDocument));
            if (!publicationView.lcp) {
                debug("LCP !!?");
                return;
            }

            // !r2Publication?.LCP?.Encryption?.UserKey?.TextHint
            if (!publicationView.lcp.textHint) {
                debug("LCP TextHint !!?");
                publicationView.lcp.textHint = "";
            }

            yield* putTyped(lcpActions.userKeyCheckRequest.build(
                    publicationView,
                    publicationView.lcp.textHint, // r2Publication.LCP.Encryption.UserKey.TextHint,
                    publicationView.lcp.urlHint,
                    message,
            ));
            return ; // do not open the reader in bottom
        }
    } catch (err) {
        debug(err);
        return;
    }

    yield* putTyped(readerActions.openRequest.build(publicationIdentifier));
}

export function saga() {
    return all([
        takeSpawnLeading(
            lcpActions.renewPublicationLicense.ID,
            renewPublicationLicense,
            (e) => error(filename_ + ":renewPublicationLicense", e),
        ),
        takeSpawnLeading(
            lcpActions.returnPublication.ID,
            returnPublication,
            (e) => error(filename_ + ":returnPublication", e),
        ),
        takeSpawnLeading(
            lcpActions.unlockPublicationWithPassphrase.ID,
            unlockPublicationWithPassphrase,
            (e) => error(filename_ + ":unlockPublicationWithPassphrase", e),
        ),
    ]);
}
