// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";
import { IOpdsResultView } from "readium-desktop/common/views/opds";

export const ID = "AUTH_PROMPT";

export function build(requestId: string, view?: IOpdsResultView):
    Action<typeof ID, { requestId: string; view?: IOpdsResultView }> {
    return { type: ID, payload: { requestId, view } };
}
build.toString = () => ID;
export type TAction = ReturnType<typeof build>;
