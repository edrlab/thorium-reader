// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import {
    publicationActions as publicationActionsCommon, readerActions,
} from "readium-desktop/common/redux/actions";
import { diMainGet } from "readium-desktop/main/di";
import {
    publicationActions as publicationActionsMainProcess,
} from "readium-desktop/main/redux/actions";
import { call, delay, put } from "redux-saga/effects";
import { SagaGenerator } from "typed-redux-saga";

export function* deletePublication(identifier: string): SagaGenerator<void> {

        yield put(readerActions.closeRequestFromPublication.build(identifier));

        // dispatch action to update publication/lastReadingQueue reducer
        yield put(publicationActionsMainProcess.deletePublication.build(identifier));

        // allow extra completion time to ensure the filesystem ZIP streams are closed
        yield delay(300);

        const publicationRepository = diMainGet("publication-repository");
        // Remove from database
        yield call(() => publicationRepository.delete(identifier));

        const publicationStorage = diMainGet("publication-storage");
        // Remove from storage
        yield call(() => publicationStorage.removePublication(identifier));

        // dispatch action to update catalog view
        yield put(publicationActionsCommon.publicationUpdated.build());
}
