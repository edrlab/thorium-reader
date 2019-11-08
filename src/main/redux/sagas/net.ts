// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as ping from "ping";
import { NetStatus } from "readium-desktop/common/redux/states/net";
import { selectTyped } from "readium-desktop/common/redux/typed-saga";
import { appActions, netActions } from "readium-desktop/main/redux/actions";
import { RootState } from "readium-desktop/main/redux/states";
import { SagaIterator } from "redux-saga";
import { call, delay, put, take } from "redux-saga/effects";

const PING_CONFIG = {
    timeout: 5,
};

const PINGABLE_HOST = "8.8.8.8";

function pingHost() {
    return ping.promise.probe(PINGABLE_HOST, PING_CONFIG);
}

function getNetStatus(state: RootState): NetStatus {
    return state.net.status;
}

export function* netStatusWatcher(): SagaIterator {
    // Wait for win init success
    yield take(appActions.ActionType.InitSuccess);

    while (true) {
        // Ping every 5 seconds
        let actionType = null;

        try {
            const result: any = yield call(pingHost); // TODO any?!
            const online = result.alive;
            actionType = online ?
                netActions.online.ID :
                netActions.offline.ID;
        } catch (error) {
            actionType = netActions.offline.ID;
        }

        const netStatus = yield* selectTyped(getNetStatus);

        if (
            netStatus === NetStatus.Unknown ||
            (
                actionType === netActions.offline.ID &&
                netStatus === NetStatus.Online
            ) ||
            (
                actionType === netActions.online.ID &&
                netStatus === NetStatus.Offline
            )
        ) {
            // Only update status if status change
            yield put({ type: actionType } as ReturnType<typeof netActions.online.build>);
        }

        yield delay(5000);
    }
}
