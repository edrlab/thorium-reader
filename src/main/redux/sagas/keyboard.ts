// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { DEBUG_KEYBOARD } from "readium-desktop/common/keyboard";
import { ToastType } from "readium-desktop/common/models/toast";
import { keyboardActions, toastActions } from "readium-desktop/common/redux/actions";
import { takeTyped } from "readium-desktop/common/redux/sagas/typed-saga";
import { diMainGet } from "readium-desktop/main/di";
import { keyboardShortcuts } from "readium-desktop/main/keyboard";
import { all, call, takeEvery } from "redux-saga/effects";
import { put } from "typed-redux-saga";

import { sortObject } from "@r2-utils-js/_utils/JsonUtils";

const debug = debug_("readium-desktop:main:redux:sagas:keyboard");

function* showShortcuts(action: keyboardActions.showShortcuts.TAction) {
    const showShortcutsFolder = async () => {
        if (action.payload.focusFile) {
            keyboardShortcuts.showUserFile();
        } else {
            keyboardShortcuts.showFolder();
        }
    };

    yield all([
        call(showShortcutsFolder),
    ]);
}
function* setShortcuts(action: keyboardActions.setShortcuts.TAction) {
    const saveShortcuts = async () => {
        if (action.payload.save) {
            debug("Keyboard shortcuts saving:", action.payload.shortcuts);
            keyboardShortcuts.saveUser(action.payload.shortcuts);
        } else {
            debug("Keyboard shortcuts NOT saving (defaults):", action.payload.shortcuts);
        }
    };

    yield all([
        call(saveShortcuts),
    ]);
}
// function* reloadShortcuts(action: keyboardActions.reloadShortcuts.TAction) {
//     const loadShortcutsFromJson = async () => {
//         if (action.payload.defaults) {
//             keyboardShortcuts.loadDefaults();
//         }
//         const okay = action.payload.defaults ? true : keyboardShortcuts.loadUser();

//         debug(`Keyboard shortcuts reload JSON (defaults: ${action.payload.defaults}) => ${okay}`);
//         if (okay) {
//             yield put(keyboardActions.setShortcuts.build(keyboardShortcuts.getAll()));
//         }
//     };

//     yield all([
//         call(loadShortcutsFromJson),
//     ]);
// }

function* keyboardSetWatcher() {
    yield takeEvery(keyboardActions.setShortcuts.build, setShortcuts);
}
function* keyboardShowWatcher() {
    yield takeEvery(keyboardActions.showShortcuts.build, showShortcuts);
}
// function* keyboardReloadWatcher() {
//     yield takeEvery(keyboardActions.reloadShortcuts.build, reloadShortcuts);
// }
function* keyboardReloadWatcher() {
    while (true) {
        const action = yield* takeTyped(keyboardActions.reloadShortcuts.build);
        if (action.payload.defaults) {
            keyboardShortcuts.loadDefaults();
        }
        const okay = action.payload.defaults ? true : keyboardShortcuts.loadUser();

        debug(`Keyboard shortcuts reload JSON (defaults: ${action.payload.defaults}) => ${okay}`);

        const currentKeyboardShortcuts = keyboardShortcuts.getAll();
        if (DEBUG_KEYBOARD) {
            const jsonDiff = require("json-diff");

            const defaultKeyboardShortcuts = keyboardShortcuts.getAllDefaults();
            const json1 = sortObject(JSON.parse(JSON.stringify(defaultKeyboardShortcuts)));
            const json2 = sortObject(JSON.parse(JSON.stringify(currentKeyboardShortcuts)));
            debug(jsonDiff.diffString(json1, json2) + "\n");
        }

        if (okay) {
            yield put(keyboardActions.setShortcuts.build(currentKeyboardShortcuts, true)); // !action.payload.defaults

            const translator = diMainGet("translator");
            yield put(toastActions.openRequest.build(ToastType.Success,
                `${translator.translate("settings.keyboard.keyboardShortcuts")}`));
        }
    }
}

export function* watchers() {
    yield all([
        call(keyboardSetWatcher),
        call(keyboardShowWatcher),
        call(keyboardReloadWatcher),
    ]);
}
