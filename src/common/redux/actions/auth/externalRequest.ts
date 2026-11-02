// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";

export const ID = "AUTH_EXTERNAL_REQUEST";
export function build(url: string, requestId: string, command: "start" | "retry" | "cancel", catalogIdentifier?: string):
    Action<typeof ID, { url: string; requestId: string; command: typeof command; catalogIdentifier?: string }> {
    return { type: ID, payload: { url, requestId, command, catalogIdentifier } };
}
build.toString = () => ID;
export type TAction = ReturnType<typeof build>;
