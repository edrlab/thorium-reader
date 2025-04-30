// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ISearchResult } from "readium-desktop/renderer/reader/redux/sagas/search/search";
import { IHighlightBaseState } from "./highlight";

export interface ISearchState {
    enable: boolean;
    state: "busy" | "idle";
    textSearch: string;
    newFocusUUId: IHighlightBaseState["uuid"];
    oldFocusUUId: IHighlightBaseState["uuid"];
    foundArray: ISearchResult[];
}

export const searchDefaultState = (): ISearchState =>
    ({
        enable: false,
        state: "idle",
        textSearch: "",
        newFocusUUId: "",
        oldFocusUUId: "",
        foundArray: [],
    });
