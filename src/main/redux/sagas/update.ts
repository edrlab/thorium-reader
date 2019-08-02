// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { delay, SagaIterator } from "redux-saga";
import { call, put, take } from "redux-saga/effects";

import { httpGet } from "readium-desktop/common/utils/http";

import { appActions } from "readium-desktop/main/redux/actions";

import { updateActions } from "readium-desktop/common/redux/actions";

import {
    _APP_VERSION,
} from "readium-desktop/preprocessor-directives";

const LATEST_VERSION_URL = "https://api.github.com/repos/edrlab/readium-desktop/releases/latest";
const CURRENT_VERSION = "v" + _APP_VERSION;

export function* updateStatusWatcher(): SagaIterator {
    // Wait for app init success
    yield take(appActions.ActionType.InitSuccess);

    while (true) {
        try {
            const result: string = yield call(() => httpGet(
                LATEST_VERSION_URL,
                {timeout: 5000},
            ));

            const jsonObj = JSON.parse(result);

            if (jsonObj.id && jsonObj.html_url) {
                const latestVersion = jsonObj.tag_name;

                if (latestVersion > CURRENT_VERSION) {
                    yield put(updateActions.setLatestVersion(
                        jsonObj.tag_name,
                        jsonObj.html_url,
                    ));
                }
            }
        } catch (error) {
            // Pass
        }

        // Try to retrieve latest version every 20 minutes
        yield call(delay, 120000);
    }
}
