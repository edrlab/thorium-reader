// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

/**
 * Synchronization of redux actions
 */

import { Action } from "../models/redux";

import { WindowSender } from "../models/sync";

export enum EventType {
    RendererAction = "RENDERER_ACTION",
    MainAction = "MAIN_ACTION",
}

export const CHANNEL = "SYNC";

export interface EventPayload {
    type: EventType;
    payload: {
        action: Action;
    };
    sender: WindowSender;
}
