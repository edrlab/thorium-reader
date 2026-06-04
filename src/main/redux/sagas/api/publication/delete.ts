// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { diMainGet } from "readium-desktop/main/di";
import { lcpActions } from "readium-desktop/common/redux/actions";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { call, delay } from "redux-saga/effects";
import { SagaGenerator, call as callTyped } from "typed-redux-saga";
import debug_ from "debug";
import { RequesetToCloseAllReadersWithTheSamePubId } from "../../reader";

const debug = debug_("readium-desktop:main/redux/saga/api/publication/delete");

const DELETE_PUBLICATION_LOCK_WAIT_MS = 100;

const tryAcquirePublicationFileLock = (identifier: string): boolean => {
    const store = diMainGet("store");
    const state = store.getState();
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

export function* deletePublication(
    publicationIdentifier: string,
    _preservePublicationOnFileSystem?: string,
    publicationFileLockAlreadyHeld = false,
): SagaGenerator<void> {

    let publicationFileLockAcquired = publicationFileLockAlreadyHeld;
    while (!publicationFileLockAcquired) {
        publicationFileLockAcquired = yield* callTyped(tryAcquirePublicationFileLock, publicationIdentifier);
        if (!publicationFileLockAcquired) {
            debug("wait before deleting publication because LCP file lock is active", publicationIdentifier);
            yield delay(DELETE_PUBLICATION_LOCK_WAIT_MS);
        }
    }

    try {
        // The shared-computer cleanup already owns the lock when it calls deletePublication().
        // Manual deletes acquire it here so deletion cannot race with LCP/LSD license injection.
        // yield put(readerActions.closeRequest.build(publicationIdentifier));
        yield* callTyped(RequesetToCloseAllReadersWithTheSamePubId, publicationIdentifier);

        // delete publication from reader registry
        // yield put(winActions.registry.unregisterReaderPublication.build(identifier));

        // allow extra completion time to ensure the filesystem ZIP streams are closed
        yield delay(300);

        const publicationStorage = diMainGet("publication-storage");
        // Remove publication files before deleting the persisted publication record.
        // If this throws, the API layer reports the error and the database remains unchanged.
        yield call(() => publicationStorage.removePublication(publicationIdentifier));

        const publicationRepository = diMainGet("publication-repository");
        // Remove from database only after successful publication storage deletion.
        yield call(() => publicationRepository.delete(publicationIdentifier));

        try {
            const publicationData = diMainGet("publication-data");
            // Remove from data storage
            yield call(() => publicationData.removePublication(publicationIdentifier));
        } catch (e) {
            debug(`${e}`);
        }

        const publicationViewConverter = diMainGet("publication-view-converter");
        // Remove from memory cache
        yield call(() => publicationViewConverter.removeFromMemoryCache(publicationIdentifier));
    } finally {
        if (!publicationFileLockAlreadyHeld) {
            yield* callTyped(releasePublicationFileLock, publicationIdentifier);
        }
    }
}
