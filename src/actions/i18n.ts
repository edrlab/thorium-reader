import { Action } from "redux";

export const SET_LOCALE = "SET_LOCALE";

export interface ILocaleAction extends Action {
  locale: string;
}

export function setLocale(locale: string): ILocaleAction {
    return {
        type: SET_LOCALE,
        locale,
    };
}
