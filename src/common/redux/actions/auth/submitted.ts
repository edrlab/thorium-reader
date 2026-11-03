// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";

import { THttpGetBrowserResultView } from "readium-desktop/common/views/browser";

export const ID = "AUTH_SUBMITTED";
export function build(credentialsUrl: string, failed: boolean, result?: THttpGetBrowserResultView):
    Action<typeof ID, { credentialsUrl: string; failed: boolean; result?: THttpGetBrowserResultView }> {
    return { type: ID, payload: { credentialsUrl, failed, result } };
}
build.toString = () => ID;
export type TAction = ReturnType<typeof build>;
