// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";
import { diReaderGet } from "readium-desktop/renderer/reader/di";

import { ISearchState } from "readium-desktop/common/redux/states/renderer/search";

export const ID = "READER_SEARCH_FOCUS";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Payload extends Partial<ISearchState> {
}

export function build(focusUUId: ISearchState["newFocusUUId"]):
    Action<typeof ID, Payload> {

    const store = diReaderGet("store");
    const { newFocusUUId: oldFocusUUId } = store.getState().search;
    return {
        type: ID,
        payload: {
            newFocusUUId: focusUUId,
            oldFocusUUId,
        },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
