// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { LOCATION_CHANGE } from "redux-first-history";
import { Location, Action as HistoryAction } from "history";
import { Action } from "readium-desktop/common/models/redux";

export const ID = LOCATION_CHANGE;

export interface Payload {
    location: Location;
    action: HistoryAction;
}

export function build(location: Location, action: HistoryAction):
    Action<typeof ID, Payload> {

    return {
        type: LOCATION_CHANGE,
        payload: { location, action },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
