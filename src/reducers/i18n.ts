import { ILocaleAction, SET_LOCALE } from "./../actions/i18n";

export interface I18NState {
    locale: string;
}

const initialState: I18NState = {
    locale: "fr",
};

export function i18n(
    state: I18NState = initialState,
    action: ILocaleAction,
    ): I18NState {
    switch (action.type) {
        case SET_LOCALE:
            state.locale = action.locale;
            return state;
        default:
            return state;
    }
}
