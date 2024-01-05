// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer } from "redux";

import { i18nActions } from "readium-desktop/common/redux/actions";

import { I18NState } from "readium-desktop/common/redux/states/i18n";

const initialState: I18NState = {
    locale: "en",
};

function i18nReducer_(
    state: I18NState = initialState,
    action: i18nActions.setLocale.TAction,
    ): I18NState {
    switch (action.type) {
        case i18nActions.setLocale.ID:
            return Object.assign({}, state, {
                locale: action.payload.locale,
            } as I18NState);
        default:
            return state;
    }
}

export const i18nReducer = i18nReducer_ as Reducer<ReturnType<typeof i18nReducer_>>;
