// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "redux";

// Reader action types
export const FLASH_MESSAGE_ADD = "FLASH_MESSAGE_ADD";
export const FLASH_MESSAGE_PURGE = "FLASH_MESSAGE_PURGE";

export interface FlashMessageAction extends Action {
    message?: string;
}

export function add(message: string): FlashMessageAction {
    return {
        type: FLASH_MESSAGE_ADD,
        message,
    };
}

export function purge(): FlashMessageAction {
    return {
        type: FLASH_MESSAGE_PURGE,
    };
}
