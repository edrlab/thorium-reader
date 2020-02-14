// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { keyboardActions } from "readium-desktop/common/redux/actions";
import { keyboardShortcuts } from "readium-desktop/main/keyboard";
import { all, call, takeEvery } from "redux-saga/effects";
import { put } from "typed-redux-saga";

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
    const debugShortcuts = async () => {
        debug("Keyboard shortcuts are set:", action.payload.shortcuts);
    };

    yield all([
        call(debugShortcuts),
    ]);
}
function* reloadShortcuts(action: keyboardActions.reloadShortcuts.TAction) {
    const loadShortcutsFromJson = async () => {
        if (action.payload.defaults) {
            keyboardShortcuts.loadDefaults();
        }
        const okay = action.payload.defaults ? true : keyboardShortcuts.loadUser();

        debug(`Keyboard shortcuts reload JSON (defaults: ${action.payload.defaults}) => ${okay}`);
        if (okay) {
            put(keyboardActions.setShortcuts.build(keyboardShortcuts.getAll()));
        }
    };

    yield all([
        call(loadShortcutsFromJson),
    ]);
}

function* keyboardSetWatcher() {
    yield takeEvery(keyboardActions.setShortcuts.build, setShortcuts);
}
function* keyboardShowWatcher() {
    yield takeEvery(keyboardActions.showShortcuts.build, showShortcuts);
}
function* keyboardReloadWatcher() {
    yield takeEvery(keyboardActions.reloadShortcuts.build, reloadShortcuts);
}

export function* watchers() {
    yield all([
        call(keyboardSetWatcher),
        call(keyboardShowWatcher),
        call(keyboardReloadWatcher),
    ]);
}
