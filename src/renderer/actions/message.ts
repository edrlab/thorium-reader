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
