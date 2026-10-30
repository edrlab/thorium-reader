// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";

export const ID = "AUTH_SUBMIT";

export function build(url: string, login: string, password: string):
    Action<typeof ID, { url: string; login: string; password: string }> {
    return { type: ID, payload: { url, login, password } };
}
build.toString = () => ID;
export type TAction = ReturnType<typeof build>;

// Credentials must never be sent to Redux developer tools.
export const sanitize = <A extends { type: string }>(action: A): A =>
    action.type === ID ? { type: ID } as A : action;
