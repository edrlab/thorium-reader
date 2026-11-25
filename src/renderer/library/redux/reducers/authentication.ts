// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { authActions } from "readium-desktop/common/redux/actions";

export interface IAuthenticationState {
    request?: authActions.prompt.TAction["payload"];
}

export function authenticationReducer(state: IAuthenticationState = {}, action: authActions.prompt.TAction): IAuthenticationState {
    if (action.type !== authActions.prompt.ID) return state;
    if (action.payload.view) return { request: action.payload };
    return state.request?.requestId === action.payload.requestId ? {} : state;
}
