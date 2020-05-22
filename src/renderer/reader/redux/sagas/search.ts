// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// tslint:disable
// @ts-nocheck

import { takeSpawnLeading } from "readium-desktop/common/redux/sagas/takeSpawnLeading";
import { selectTyped } from "readium-desktop/common/redux/sagas/typed-saga";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { all, spawn, take } from "redux-saga/effects";

import { readerLocalActionSearch } from "../actions";

function* searchProcess(action: readerLocalActionSearch.request.TAction) {

    const manifest = yield* selectTyped((state: IReaderRootState) => state);
}

export const saga = () => {
    return all([
        takeSpawnLeading(
            readerLocalActionSearch.request.ID,
            searchProcess,
            (e) => console.error(e),
        ),
    ]);
};
