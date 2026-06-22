// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";
import { lcpInfoHasConfirmedNoLongerUsableStatus, lcpInfoIsNoLongerUsable } from "readium-desktop/common/lcp";
import { lcpActions, settingsActions } from "readium-desktop/common/redux/actions";
import { takeSpawnLeading } from "readium-desktop/common/redux/sagas/takeSpawnLeading";
import { settingsLcpAutoDeleteExpiredPublicationsIsEnabled } from "readium-desktop/common/redux/states/settings";
import { PublicationDocument } from "readium-desktop/main/db/document/publication";
import { diMainGet } from "readium-desktop/main/di";
import { RootState } from "readium-desktop/main/redux/states";
import { error } from "readium-desktop/main/tools/error";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { all } from "redux-saga/effects";
import { call as callTyped, delay as delayTyped, select as selectTyped, spawn as spawnTyped } from "typed-redux-saga/macro";
import { SagaGenerator } from "typed-redux-saga";

const filename_ = "readium-desktop:main:redux:sagas:publication:lcpSharedWorkstationCleanup";
const debug = debug_(filename_);

const LCP_SHARED_WORKSTATION_CLEANUP_STARTUP_DELAY_MS = 1000 * 30;
const LCP_SHARED_WORKSTATION_CLEANUP_INTERVAL_MS = 1000 * 60 * 15;

const cleanupIsEnabled = (state: RootState) =>
    settingsLcpAutoDeleteExpiredPublicationsIsEnabled(state.settings);

// Prevent overlapping full-library scans from the periodic timer and settings-triggered cleanup.
let cleanupAllInProgress = false;

interface ICleanupLcpPublicationOptions {
    force?: boolean;
    allowLocalRightsEndFallback?: boolean;
    skipLicenseUpdate?: boolean;
}

const tryAcquirePublicationFileLock = (identifier: string): boolean => {
    const store = diMainGet("store");
    const state: RootState = store.getState();
    if (state.lcp.publicationFileLocks[identifier]) {
        return false;
    }

    store.dispatch(lcpActions.publicationFileLock.build({ [identifier]: true }));
    return true;
};

const releasePublicationFileLock = (identifier: string) => {
    const store = diMainGet("store");
    store.dispatch(lcpActions.publicationFileLock.build({ [identifier]: false }));
};

const lcpInfoCanBeDeleted = (
    lcp: PublicationDocument["lcp"],
    options: ICleanupLcpPublicationOptions,
): boolean => {
    // Background/shared-computer cleanup deletes only when LSD confirms a terminal status.
    // User-initiated replacement imports pass allowLocalRightsEndFallback so an old local
    // license with an expired rights.end can be removed before importing the new copy.
    return lcpInfoHasConfirmedNoLongerUsableStatus(lcp) ||
        (options.allowLocalRightsEndFallback === true && lcpInfoIsNoLongerUsable(lcp));
};

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
    if (!options.skipLicenseUpdate) {
        try {
            evaluatedPublicationDocument = yield* callTyped(
                // DOES NOT MUTATE publicationDocument (returns a modified copy)
                () => lcpManager.checkPublicationLicenseUpdate(publicationDocument, false),
            );
        } catch (e) {
            debug("checkPublicationLicenseUpdate failed", publicationDocument.identifier, e);
        }
    } else {
        debug("skip license update check, caller already synchronized publication", publicationDocument.identifier, reason);
    }

    const refreshedPublicationFileLocks = yield* selectTyped((state: RootState) => state.lcp.publicationFileLocks);
    if (refreshedPublicationFileLocks[evaluatedPublicationDocument.identifier]) {
        debug("skip locked publication after license update check", evaluatedPublicationDocument.identifier, reason);
        return evaluatedPublicationDocument;
    }

    const publicationRepository = yield* callTyped(() => diMainGet("publication-repository"));
    const latestPublicationDocument = yield* callTyped(
        () => publicationRepository.get(evaluatedPublicationDocument.identifier),
    );
    if (!latestPublicationDocument) {
        debug("publication already deleted before cleanup evaluation", evaluatedPublicationDocument.identifier, reason);
        return undefined;
    }
    evaluatedPublicationDocument = latestPublicationDocument;

    if (!lcpInfoCanBeDeleted(evaluatedPublicationDocument?.lcp, options)) {
        return evaluatedPublicationDocument;
    }

    const lockAcquired = yield* callTyped(tryAcquirePublicationFileLock, evaluatedPublicationDocument.identifier);
    if (!lockAcquired) {
        debug("skip locked publication before deletion", evaluatedPublicationDocument.identifier, reason);
        return evaluatedPublicationDocument;
    }

    try {
        const enabledBeforeDelete = yield* selectTyped(cleanupIsEnabled);
        if (!enabledBeforeDelete && !options.force) {
            debug("skip deletion because shared workstation cleanup was disabled", evaluatedPublicationDocument.identifier, reason);
            return evaluatedPublicationDocument;
        }

        const currentPublicationDocument = yield* callTyped(
            () => publicationRepository.get(evaluatedPublicationDocument.identifier),
        );
        if (!currentPublicationDocument) {
            debug("publication already deleted before final cleanup", evaluatedPublicationDocument.identifier, reason);
            return undefined;
        }

        if (!currentPublicationDocument.lcp || !lcpInfoCanBeDeleted(currentPublicationDocument.lcp, options)) {
            debug("skip deletion because publication is usable after final refresh", currentPublicationDocument.identifier, reason);
            return currentPublicationDocument;
        }

        const message = `LCP cleanup (${reason}): deleting publication and associated local user data: ${currentPublicationDocument.identifier} "${currentPublicationDocument.title || ""}"`;
        debug(message);
        const publicationApi = yield* callTyped(() => diMainGet("publication-api"));
        // The cleanup owns the LCP file lock from this point until the delete flow completes.
        yield* callTyped(publicationApi.delete, currentPublicationDocument.identifier, undefined, true);
    } finally {
        yield* callTyped(releasePublicationFileLock, evaluatedPublicationDocument.identifier);
    }

    return undefined;
}

export function* cleanupAllLcpPublicationsIfNoLongerUsable(reason: string): SagaGenerator<void> {
    if (cleanupAllInProgress) {
        debug("skip cleanup scan already in progress", reason);
        return;
    }

    cleanupAllInProgress = true;
    try {
        const enabled = yield* selectTyped(cleanupIsEnabled);
        if (!enabled) {
            return;
        }

        const publicationRepository = yield* callTyped(() => diMainGet("publication-repository"));
        const publicationDocuments = publicationRepository.findAll();
        for (const publicationDocument of publicationDocuments) {
            const enabledForPublication = yield* selectTyped(cleanupIsEnabled);
            if (!enabledForPublication) {
                debug("stop cleanup scan because shared workstation cleanup was disabled", reason);
                return;
            }

            try {
                yield* callTyped(cleanupLcpPublicationIfNoLongerUsable, publicationDocument, reason);
            } catch (e) {
                debug(`ERROR: cleanupAllLcpPublicationsIfNoLongerUsable:${publicationDocument.identifier}`, e);
            }
        }
    } finally {
        cleanupAllInProgress = false;
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
            debug("ERROR: runPeriodicCleanup", e);
        }
        yield* delayTyped(LCP_SHARED_WORKSTATION_CLEANUP_INTERVAL_MS);
    }
}

export function saga() {
    return all([
        spawnTyped(runPeriodicCleanup),
        takeSpawnLeading(
            [
                settingsActions.lcpAutoDeleteExpiredPublications.ID,
                settingsActions.lcpAutoDeleteExpiredPublicationsForced.ID,
            ],
            runCleanupWhenEnabled,
            (e) => error(filename_ + ":runCleanupWhenEnabled", e),
        ),
    ]);
}
