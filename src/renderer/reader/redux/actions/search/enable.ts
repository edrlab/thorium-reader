// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";
import { ISearchState } from "readium-desktop/common/redux/states/renderer/search";

export const ID = "READER_SEARCH_ENABLE";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Payload extends Partial<ISearchState> {
}

export function build():
    Action<typeof ID, Payload> {

    return {
        type: ID,
        payload: {
            enable: true,
        },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
