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
    yield take(appActions.initSuccess.ID);

    while (true) {
        // Ping every 5 seconds
        let actionNet = null;

        try {
            const result: any = yield call(pingHost); // TODO any?!
            const online = result.alive;
            actionNet = online ?
                netActions.online.build() :
                netActions.offline.build();
        } catch (error) {
            actionNet = netActions.offline.build();
        }

        const netStatus = yield* selectTyped(getNetStatus);

        if (
            netStatus === NetStatus.Unknown ||
            (
                actionNet === netActions.offline.build() &&
                netStatus === NetStatus.Online
            ) ||
            (
                actionNet === netActions.online.build() &&
                netStatus === NetStatus.Offline
            )
        ) {
            // Only update status if status change
            yield put(actionNet);
        }

        yield delay(5000);
    }
}
