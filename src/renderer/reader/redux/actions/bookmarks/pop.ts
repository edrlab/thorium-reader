// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";
import { IBookmarkState } from "readium-desktop/common/redux/states/bookmark";

export const ID = "READER_BOOKMARKS_POP";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Payload extends IBookmarkState {
}

export function build(param: IBookmarkState):
    Action<typeof ID, Payload> {

    return {
        type: ID,
        payload: param,
        // TODO payload: param is not a fresh object duplication because the priorityQueueReducer in redux-reducers compare reference and not apply a deepComparaison or Uuid compairaison.
        // This is definitely Not a good practice !!
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
