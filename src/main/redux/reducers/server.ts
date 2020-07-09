// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { serverActions } from "../actions";
import { IServerState } from "../states/server";

const initialState: IServerState = {
    url: "",
};

export function serverReducer(
    state = initialState,
    action: serverActions.setUrl.TAction,
): IServerState {
    switch (action.type) {
        case serverActions.setUrl.ID:
            return {
                url: action.payload.url,
            };
        default:
            return state;
    }
}
