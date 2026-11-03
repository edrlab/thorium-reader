// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";

import { IOpdsAuthView } from "readium-desktop/common/views/opds";

type Options = Partial<Pick<IOpdsAuthView, "authenticationType" | "authenticationId" | "oauthUrl" | "oauthRefreshUrl">>;

export const ID = "AUTH_SUBMIT";
export function build(credentialsUrl: string, login: string, password: string, options?: Options):
    Action<typeof ID, { credentialsUrl: string; login: string; password: string; options?: Options }> {
    return { type: ID, payload: { credentialsUrl, login, password, options } };
}
build.toString = () => ID;
export type TAction = ReturnType<typeof build>;
