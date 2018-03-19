import { Action } from "readium-desktop/common/models/redux";

export enum ActionType {
    Set = "LOCALE_SET",
}

export function setLocale(locale: string): Action {
    return {
        type: ActionType.Set,
        payload: {
            locale,
        },
    };
}
