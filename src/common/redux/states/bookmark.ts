// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Locator } from "readium-desktop/common/models/locator";
import { TPQueueState } from "readium-desktop/utils/redux-reducers/pqueue.reducer";

export type TBookmarkState = TPQueueState<number, IBookmarkState>;

export interface IBookmarkState {
    uuid: string;
    name: string;
    locator: Locator;
}

export type IBookmarkStateWithoutUUID = Partial<Pick<IBookmarkState, "uuid">> & Pick<IBookmarkState, "name" | "locator">;
