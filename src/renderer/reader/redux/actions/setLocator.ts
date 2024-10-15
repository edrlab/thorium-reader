// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// import { LocatorExtended } from "@r2-navigator-js/electron/renderer";
import { MiniLocatorExtended } from "readium-desktop/common/redux/states/locatorInitialState";

import { Action } from "readium-desktop/common/models/redux";

export const ID = "READER_SET_LOCATOR_IN_RENDERER";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Payload extends MiniLocatorExtended {
}

export function build(miniLocatorExtended: MiniLocatorExtended):
    Action<typeof ID, Payload> {

    return {
        type: ID,
        payload: miniLocatorExtended,
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
