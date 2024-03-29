// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";
import { ISearchDocument } from "readium-desktop/utils/search/search.interface";

import { ISearchState } from "readium-desktop/common/redux/states/renderer/search";

export const ID = "READER_SEARCH_SET_CACHE";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Payload extends Partial<ISearchState> {
}

export function build(...data: ISearchDocument[]):
    Action<typeof ID, Payload> {

    return {
        type: ID,
        payload: {
            cacheArray: data,
        },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
