// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { updateActions } from "readium-desktop/common/redux/actions";
import { UpdateStatus } from "readium-desktop/common/redux/states/update";
import { callTyped } from "readium-desktop/common/redux/typed-saga";
import { httpGet, IHttpGetResult } from "readium-desktop/common/utils/http";
import { appActions } from "readium-desktop/main/redux/actions";
import { _APP_VERSION } from "readium-desktop/preprocessor-directives";
import { SagaIterator } from "redux-saga";
import { delay, put, take } from "redux-saga/effects";

const LATEST_VERSION_URL = "https://api.github.com/repos/edrlab/readium-desktop/releases/latest";
const CURRENT_VERSION = "v" + _APP_VERSION;

export function* updateStatusWatcher(): SagaIterator {
    // Wait for app init success
    yield take(appActions.initSuccess.ID);

    while (true) {
        try {
            const result: IHttpGetResult<string, any> =
            yield* callTyped(() => httpGet(
                LATEST_VERSION_URL,
                {
                    timeout: 5000,
                    json: true,
                },
            ));

            if (result.isFailure) {
                throw new Error(`Http get error with code
                    ${result.statusCode} for ${result.url}`);
            }

            const jsonObj = result.data;

            if (jsonObj.id && jsonObj.html_url) {
                const latestVersion = jsonObj.tag_name;

                if (latestVersion > CURRENT_VERSION) {
                    yield put(updateActions.latestVersion.build(
                        UpdateStatus.Update,
                        jsonObj.tag_name,
                        jsonObj.html_url,
                    ));
                }
            }
        } catch (error) {
            // Pass
        }

        // Try to retrieve latest version every 20 minutes
        yield delay(120000);
    }
}
