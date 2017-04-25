import { Action } from "redux";

export const SET_LOCALE = "SET_LOCALE";

export interface LocaleAction extends Action {
    locale: string;
}

export function setLocale(locale: string): LocaleAction {
    return {
        type: SET_LOCALE,
        locale,
    };
}
