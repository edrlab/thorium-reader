import { delay, SagaIterator } from "redux-saga";
import { call, put, select, take } from "redux-saga/effects";

import { requestGet } from "readium-desktop/utils/http";

import { appActions } from "readium-desktop/main/redux/actions";

import { updateActions } from "readium-desktop/common/redux/actions";

import {
    _APP_VERSION,
} from "readium-desktop/preprocessor-directives";

const LATEST_VERSION_URL = "https://api.github.com/repos/readium/readium-desktop/releases/latest";
const CURRENT_VERSION = "v" + _APP_VERSION;

export function* updateStatusWatcher(): SagaIterator {
    // Wait for app init success
    yield take(appActions.ActionType.InitSuccess);

    while (true) {
        try {
            const result = yield call(() => requestGet(
                LATEST_VERSION_URL,
                {timeout: 5000},
            ));

            if (result.response.statusCode === 200) {
                const jsonObj = JSON.parse(result.response.body);

                if (jsonObj.id && jsonObj.html_url) {
                    const latestVersion = jsonObj.tag_name;

                    if (latestVersion > CURRENT_VERSION) {
                        yield put(updateActions.setLatestVersion(
                            jsonObj.tag_name,
                            jsonObj.html_url,
                        ));
                    }
                }
            }
        } catch (error) {
            // Pass
        }

        // Try to retrieve latest version every 20 minutes
        yield call(delay, 120000);
    }
}
