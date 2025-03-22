// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { TPQueueState } from "readium-desktop/utils/redux-reducers/pqueue.reducer";
import { INoteCreator } from "./creator";
import { MiniLocatorExtended } from "./locatorInitialState";
import { IColor } from "@r2-navigator-js/electron/common/highlight";

export type TBookmarkState = TPQueueState<number, IBookmarkState>;

export interface IBookmarkState {
    uuid: string;
    name: string | undefined;
    index: number;

    locatorExtended: MiniLocatorExtended,

    color: IColor;
    modified?: number;
    created: number;
    creator?: INoteCreator;
}

export type IBookmarkStateWithoutUUID = Partial<Pick<IBookmarkState, "uuid">> & Omit<IBookmarkState, "uuid">;
