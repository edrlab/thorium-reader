// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import {
    LOCATION_CHANGE, LocationChangePayload, onLocationChanged,
    RouterActionType,
} from "connected-react-router";
import { Location } from "history";
import { Action } from "readium-desktop/common/models/redux";
import { IRouterLocationState } from "readium-desktop/renderer/routing";

export const ID = LOCATION_CHANGE;

export function build(location: Location<IRouterLocationState>, action: RouterActionType, isFirstRendering?: boolean):
    Action<typeof ID, LocationChangePayload<IRouterLocationState>> {

    return onLocationChanged(location, action, isFirstRendering);
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
