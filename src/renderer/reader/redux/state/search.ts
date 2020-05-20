// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { IHighlightBaseState, IHighlightHandlerState } from "./highlight";

export interface ISearchState {
    enable: boolean;
    state: "busy" | "idle";
    textSearch: string;
    focusUUId: IHighlightBaseState["uuid"];
    foundArray: IHighlightHandlerState[];
}

export const searchDefaultState = (): ISearchState =>
    ({
        enable: false,
        state: "idle",
        textSearch: "",
        focusUUId: "",
        foundArray: [],
    });
