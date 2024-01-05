// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer } from "redux";

import { ReaderInfo } from "readium-desktop/common/models/reader";

// READONLY
function readerInfoReducer_(
    state: ReaderInfo = null, // injected by preloaded state
): ReaderInfo {

    return state;
}

export const readerInfoReducer = readerInfoReducer_ as Reducer<ReturnType<typeof readerInfoReducer_>>;
