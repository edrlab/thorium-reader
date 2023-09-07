// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";
import { CatalogView } from "readium-desktop/common/views/catalog";

export const ID = "CATALOG_SET_VIEW";

export interface Payload {
    catalogView: CatalogView;
}

export function build(catalogView: CatalogView):
    Action<typeof ID, Payload> {

    return {
        type: ID,
        payload: {
            catalogView,
        },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
