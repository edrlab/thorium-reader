// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { SagaIterator } from "redux-saga";
import { call, fork, put, take } from "redux-saga/effects";

import { OpdsFeed } from "readium-desktop/common/models/opds";

import { container } from "readium-desktop/main/di";

import { OpdsRepository } from "readium-desktop/main/db/repository/opds";

import { opdsActions } from "readium-desktop/common/redux/actions";
import { appActions } from "readium-desktop/main/redux/actions";

export function* opdsInitWatcher(): SagaIterator {
    yield take(appActions.ActionType.InitSuccess);

    // Get opds repository
    const opdsRepository: OpdsRepository = container.get(
        "opds-repository") as OpdsRepository;

    // Init opds store
    try {
        const result = yield call(() => opdsRepository.findAll());

        yield put({
            type: opdsActions.ActionType.SetSuccess,
            payload: {
                items: result,
            },
        });
    } catch (error) {
        yield put({ type: opdsActions.ActionType.SetError, error: true });
    }
}

export function* opdsAddRequestWatcher(): SagaIterator {
    while (true) {
        const requestAction = yield take(opdsActions.ActionType.AddRequest);
        const opds: OpdsFeed = requestAction.payload.item;

        // Get opds repository
        const opdsRepository: OpdsRepository = container.get(
            "opds-repository") as OpdsRepository;

        // Add new opds feed
        try {
            const result = yield call(() => opdsRepository.save(opds));
            yield put({
                type: opdsActions.ActionType.AddSuccess,
                payload: {
                    item: opds,
                },
            });
        } catch (error) {
            yield put({ type: opdsActions.ActionType.AddError, error: true });
        }
    }
}

export function* opdsUpdateRequestWatcher(): SagaIterator {
    while (true) {
        const requestAction = yield take(opdsActions.ActionType.UpdateRequest);
        const opds: OpdsFeed = requestAction.payload.item;

        // Get opds repository
        const opdsRepository: OpdsRepository = container.get(
            "opds-repository") as OpdsRepository;

        // Update opds feed
        try {
            const result = yield call(() => opdsRepository.save(opds.identifier));
            yield put({
                type: opdsActions.ActionType.UpdateSuccess,
                payload: {
                    item: opds,
                },
            });
        } catch (error) {
            yield put({ type: opdsActions.ActionType.UpdateError, error: true });
        }
    }
}

export function* opdsRemoveRequestWatcher(): SagaIterator {
    while (true) {
        const requestAction = yield take(opdsActions.ActionType.RemoveRequest);

        const opds: OpdsFeed = requestAction.payload.item;

        // Get opds repository
        const opdsRepository: OpdsRepository = container.get(
            "opds-repository") as OpdsRepository;

        // Remove opds feed
        try {
            const result = yield call(() => opdsRepository.delete(opds.identifier));
            yield put({
                type: opdsActions.ActionType.RemoveSuccess,
                payload: {
                    item: opds,
                },
            });
        } catch (error) {
            yield put({ type: opdsActions.ActionType.RemoveError, error: true });
        }
    }
}
