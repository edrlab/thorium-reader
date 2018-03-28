// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import {
    FLASH_MESSAGE_ADD,
    FLASH_MESSAGE_PURGE,
    FlashMessageAction,
} from "readium-desktop/renderer/actions/message";

export enum MessageStatus {
    Closed,
    Open,
}

export interface MessageState {
    status: MessageStatus;
    messages: string[];
}

const initialState: MessageState = {
    status: MessageStatus.Closed,
    messages: [],
};

export function messageReducer(
    state: MessageState = initialState,
    action: FlashMessageAction,
    ): MessageState {
    switch (action.type) {
        case FLASH_MESSAGE_ADD:
            state.status = MessageStatus.Open;
            state.messages.push(action.message);
            return state;
        case FLASH_MESSAGE_PURGE:
            state.status = MessageStatus.Closed;
            state.messages.shift();
            return state;
        default:
            return state;
    }
}
