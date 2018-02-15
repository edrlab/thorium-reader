import * as ping from "ping";
import { delay, SagaIterator } from "redux-saga";
import { call, put, select, take } from "redux-saga/effects";

import { Settings } from "readium-desktop/common/models/settings";

import { container } from "readium-desktop/main/di";

import { ReaderSettingsDb } from "readium-desktop/main/db/reader-settings-db";

import { readerSettingsActions } from "readium-desktop/common/redux/actions";

import * as uuid from "uuid";

export function* readerSettingsSaveRequestWatcher(): SagaIterator {
    while (true) {
        // Wait for save request
        const action = yield take(readerSettingsActions.ActionType.SaveRequest);
        const settings: Settings = action.payload.settings;

        // Get Reader Settings db
        const readerSettingsDb: ReaderSettingsDb = container.get(
        "reader-settings-db") as ReaderSettingsDb;

        try {
            const searchResult = yield call(() => readerSettingsDb.getAll());
            if (searchResult.length > 0) {
                settings.identifier = searchResult[0].identifier;
                yield call(() => readerSettingsDb.update(settings));
            } else {
                settings.identifier = uuid.v4();
                yield call(() => readerSettingsDb.put(settings));
            }
            yield put({
                type: readerSettingsActions.ActionType.SaveSuccess,
                payload: {
                    settings,
                },
            });
        } catch (error) {
            yield put({ type: readerSettingsActions.ActionType.SaveError, error: true });
        }
    }
}

export function* readerSettingsRestoreRequestWatcher(): SagaIterator {
    while (true) {
        // Wait for save request
        const action = yield take(readerSettingsActions.ActionType.RestoreRequest);

        // Get Reader Settings db
        const readerSettingsDb: ReaderSettingsDb = container.get(
        "reader-settings-db") as ReaderSettingsDb;

        try {
            const searchResult = yield call(() => readerSettingsDb.getAll());
            if (searchResult.length > 0) {
                yield put({
                    type: readerSettingsActions.ActionType.RestoreSuccess,
                    payload: {
                        settings: searchResult[0],
                    },
                });
            } else {
                yield put({ type: readerSettingsActions.ActionType.RestoreError, error: true });
            }
        } catch (error) {
            yield put({ type: readerSettingsActions.ActionType.RestoreError, error: true });
        }
    }
}
