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
