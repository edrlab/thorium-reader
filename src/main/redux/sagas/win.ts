// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { systemPreferences } from "electron";
import { SagaIterator } from "redux-saga";
import { put, take } from "redux-saga/effects";

import { winActions } from "readium-desktop/renderer/redux/actions";

import { highContrastChanged } from "readium-desktop/common/redux/actions/style";
import { HighContrastColors } from "readium-desktop/renderer/redux/states/style";

export function* winInitSuccessWatcher(): SagaIterator {
    while (true) {
        yield take(winActions.ActionType.InitSuccess);

        if (systemPreferences.isHighContrastColorScheme()) {
            const colors: HighContrastColors = {
                background: systemPreferences.getColor("window"),
                text: systemPreferences.getColor("window-text"),
                buttonBackground: systemPreferences.getColor("button-text"),
                buttonText: systemPreferences.getColor("button-text"),
                highlight: systemPreferences.getColor("highlight"),
                disabled: systemPreferences.getColor("disabled-text"),
                highlightText: systemPreferences.getColor("highlight-text"),
            };
            yield put(highContrastChanged(true, colors));
        }
    }
}
