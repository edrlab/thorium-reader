// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";
import { ISearchState } from "readium-desktop/common/redux/states/renderer/search";

export const ID = "READER_SEARCH_FOUND";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IPayload extends Partial<ISearchState> {
}

export function build(list: ISearchState["foundArray"]):
    Action<typeof ID, IPayload> {

    return {
        type: ID,
        payload: {
            foundArray: list,
            state: "idle",
        },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
