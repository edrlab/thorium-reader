// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as ping from "ping";
import { SagaIterator } from "redux-saga";
import { call, delay, put, select, take } from "redux-saga/effects";

import { NetStatus } from "readium-desktop/common/redux/states/net";
import { appActions, netActions } from "readium-desktop/main/redux/actions";

const PING_CONFIG = {
    timeout: 5,
};

const PINGABLE_HOST = "8.8.8.8";

function pingHost() {
    return ping.promise.probe(PINGABLE_HOST, PING_CONFIG);
}

function getNetStatus(state: any): NetStatus {
    return state.net.status;
}

export function* netStatusWatcher(): SagaIterator {
    // Wait for win init success
    yield take(appActions.ActionType.InitSuccess);

    while (true) {
        // Ping every 5 seconds
        let actionType = null;

        try {
            const result: any = yield call(pingHost);
            const online = result.alive;
            actionType = online ?
                netActions.ActionType.Online :
                netActions.ActionType.Offline;
        } catch (error) {
            actionType = netActions.ActionType.Offline;
        }

        const netStatus = yield select(getNetStatus);

        if (
            netStatus === NetStatus.Unknown ||
            (
                actionType === netActions.ActionType.Offline &&
                netStatus === NetStatus.Online
            ) ||
            (
                actionType === netActions.ActionType.Online &&
                netStatus === NetStatus.Offline
            )
        ) {
            // Only update status if status change
            yield put({ type: actionType });
        }

        yield delay(5000);
    }
}
