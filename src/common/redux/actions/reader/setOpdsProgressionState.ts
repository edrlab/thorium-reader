// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import type { IOpdsProgressionState } from "readium-desktop/common/redux/states/renderer/opdsProgression";
import { ActionWithDestination } from "readium-desktop/common/models/sync";

export const ID = "READER_SET_OPDS_PROGRESSION_STATE";
export function build(readerWindowIdentifier: string, state: IOpdsProgressionState):
    ActionWithDestination<typeof ID, { state: IOpdsProgressionState }> {
    return { type: ID, payload: { state }, destination: { identifier: readerWindowIdentifier } };
}
build.toString = () => ID;
export type TAction = ReturnType<typeof build>;
