// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";
import { ISearchState } from "../../state/search";

export const ID = "READER_SEARCH_REQUEST";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IPayload extends Partial<ISearchState> {
}

export function build(text: string):
    Action<typeof ID, IPayload> {

    return {
        type: ID,
        payload: {
            textSearch: text,
            state: "busy",
        },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
