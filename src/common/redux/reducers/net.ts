// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { netActions } from "readium-desktop/common/redux/actions";
import { NetState, NetStatus } from "readium-desktop/common/redux/states/net";

const initialState: NetState = {
    status: NetStatus.Unknown,
};

export function netReducer(
    state: NetState = initialState,
    action: netActions.offline.TAction |
        netActions.online.TAction,
) {
    switch (action.type) {
        case netActions.offline.ID:
            return Object.assign({}, state, {
                status: NetStatus.Offline,
            });
        case netActions.online.ID:
            return Object.assign({}, state, {
                status: NetStatus.Online,
            });
        default:
            return state;
    }
}
