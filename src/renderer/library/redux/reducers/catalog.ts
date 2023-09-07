// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { CatalogView } from "readium-desktop/common/views/catalog";
import { catalogActions } from "readium-desktop/common/redux/actions";

const initialState: CatalogView = {
    entries: [],
};

export function catalogViewReducer(
    state: CatalogView = initialState,
    action: catalogActions.setCatalog.TAction,
):  CatalogView {
    switch (action.type) {
        case catalogActions.setCatalog.ID:
            const {catalogView} = action.payload; // comming from RPC, should be already a fresh new object
            return catalogView;

        default:
            return state;
    }
}
