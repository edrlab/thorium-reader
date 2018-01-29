import { Action } from "readium-desktop/common/models/redux";

import { i18nActions } from "readium-desktop/common/redux/actions";

import { I18NState } from "readium-desktop/common/redux/states/i18n";

const initialState: I18NState = {
    locale: "fr",
};

export function i18n(
    state: I18NState = initialState,
    action: Action,
    ): I18NState {
    switch (action.type) {
        case i18nActions.ActionType.Set:
            return Object.assign({}, state, {
                locale: action.payload.locale,
            });
        default:
            return state;
    }
}
