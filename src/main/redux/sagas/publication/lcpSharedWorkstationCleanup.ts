// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";
import { settingsActions } from "readium-desktop/common/redux/actions";
import { takeSpawnEvery } from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { lcpInfoIsNoLongerUsable } from "readium-desktop/common/lcp";
import { PublicationDocument } from "readium-desktop/main/db/document/publication";
import { diMainGet } from "readium-desktop/main/di";
import { RootState } from "readium-desktop/main/redux/states";
import { error } from "readium-desktop/main/tools/error";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { all } from "redux-saga/effects";
import { SagaGenerator, call as callTyped, delay as delayTyped, select as selectTyped, spawn as spawnTyped } from "typed-redux-saga/macro";

const filename_ = "readium-desktop:main:redux:sagas:publication:lcpSharedWorkstationCleanup";
const debug = debug_(filename_);

const LCP_SHARED_WORKSTATION_CLEANUP_STARTUP_DELAY_MS = 1000 * 30;
const LCP_SHARED_WORKSTATION_CLEANUP_INTERVAL_MS = 1000 * 60 * 15;

const cleanupIsEnabled = (state: RootState) =>
    state.settings?.lcpAutoDeleteExpiredPublications === true;

interface ICleanupLcpPublicationOptions {
    force?: boolean;
}

export function* cleanupLcpPublicationIfNoLongerUsable(
    publicationDocument: PublicationDocument,
    reason: string,
    options: ICleanupLcpPublicationOptions = {},
): SagaGenerator<PublicationDocument | undefined> {

    const enabled = yield* selectTyped(cleanupIsEnabled);
    if ((!enabled && !options.force) || !publicationDocument?.lcp) {
        return publicationDocument;
    }

    const publicationFileLocks = yield* selectTyped((state: RootState) => state.lcp.publicationFileLocks);
    if (publicationFileLocks[publicationDocument.identifier]) {
        debug("skip locked publication", publicationDocument.identifier, reason);
        return publicationDocument;
    }

    const lcpManager = yield* callTyped(() => diMainGet("lcp-manager"));
    let evaluatedPublicationDocument = publicationDocument;
    try {
        evaluatedPublicationDocument = yield* callTyped(
            () => lcpManager.checkPublicationLicenseUpdate(publicationDocument, false),
        );
    } catch (e) {
        debug("checkPublicationLicenseUpdate failed", publicationDocument.identifier, e);
    }

    const refreshedPublicationFileLocks = yield* selectTyped((state: RootState) => state.lcp.publicationFileLocks);
    if (refreshedPublicationFileLocks[evaluatedPublicationDocument.identifier]) {
        debug("skip locked publication after license update check", evaluatedPublicationDocument.identifier, reason);
        return evaluatedPublicationDocument;
    }

    if (!lcpInfoIsNoLongerUsable(evaluatedPublicationDocument?.lcp)) {
        return evaluatedPublicationDocument;
    }

    const message = `LCP cleanup (${reason}): deleting publication and associated local user data: ${evaluatedPublicationDocument.identifier} "${evaluatedPublicationDocument.title || ""}"`;
    debug(message);
    const publicationApi = yield* callTyped(() => diMainGet("publication-api"));
    yield* callTyped(publicationApi.delete, evaluatedPublicationDocument.identifier);

    return undefined;
}

export function* cleanupAllLcpPublicationsIfNoLongerUsable(reason: string): SagaGenerator<void> {
    const enabled = yield* selectTyped(cleanupIsEnabled);
    if (!enabled) {
        return;
    }

    const publicationRepository = yield* callTyped(() => diMainGet("publication-repository"));
    const publicationDocuments = publicationRepository.findAll();
    for (const publicationDocument of publicationDocuments) {
        try {
            yield* callTyped(cleanupLcpPublicationIfNoLongerUsable, publicationDocument, reason);
        } catch (e) {
            error(`${filename_}:cleanupAllLcpPublicationsIfNoLongerUsable:${publicationDocument.identifier}`, e);
        }
    }
}

function* runCleanupWhenEnabled(): SagaGenerator<void> {
    yield* callTyped(cleanupAllLcpPublicationsIfNoLongerUsable, "setting-enabled");
}

function* runPeriodicCleanup(): SagaGenerator<void> {
    yield* delayTyped(LCP_SHARED_WORKSTATION_CLEANUP_STARTUP_DELAY_MS);
    while (true) {
        try {
            yield* callTyped(cleanupAllLcpPublicationsIfNoLongerUsable, "periodic");
        } catch (e) {
            error(filename_ + ":runPeriodicCleanup", e);
        }
        yield* delayTyped(LCP_SHARED_WORKSTATION_CLEANUP_INTERVAL_MS);
    }
}

export function saga() {
    return all([
        spawnTyped(runPeriodicCleanup),
        takeSpawnEvery(
            settingsActions.lcpAutoDeleteExpiredPublications.ID,
            runCleanupWhenEnabled,
            (e) => error(filename_ + ":runCleanupWhenEnabled", e),
        ),
    ]);
}
