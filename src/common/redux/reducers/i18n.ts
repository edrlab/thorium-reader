// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";

import { i18nActions } from "readium-desktop/common/redux/actions";

import { I18NState } from "readium-desktop/common/redux/states/i18n";

const initialState: I18NState = {
    locale: 'en',
};

export function i18nReducer(
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
