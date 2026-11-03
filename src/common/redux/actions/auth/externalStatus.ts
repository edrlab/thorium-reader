// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";

export type Status = "preparing" | "waiting" | "fallback" | "failed" | "expired" | "cancelled" | "complete";
export const ID = "AUTH_EXTERNAL_STATUS";
export function build(requestId: string, status: Status, authorizationUrl?: string):
    Action<typeof ID, { requestId: string; status: Status; authorizationUrl?: string }> {
    return { type: ID, payload: { requestId, status, authorizationUrl } };
}
build.toString = () => ID;
export type TAction = ReturnType<typeof build>;
