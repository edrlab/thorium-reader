// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { ToastType } from "readium-desktop/common/models/toast";
import { keyboardActions, toastActions } from "readium-desktop/common/redux/actions";
import { takeSpawnEvery } from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { takeSpawnLeading } from "readium-desktop/common/redux/sagas/takeSpawnLeading";
import { diMainGet } from "readium-desktop/main/di";
import { error } from "readium-desktop/main/error";
import { keyboardShortcuts } from "readium-desktop/main/keyboard";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { all } from "redux-saga/effects";
import { call as callTyped, put as putTyped } from "typed-redux-saga/macro";

const filename_ = "readium-desktop:main:redux:sagas:keyboard";
const debug = debug_(filename_);

function showShortcuts(action: keyboardActions.showShortcuts.TAction) {
    if (action.payload.focusFile) {
        keyboardShortcuts.showUserFile();
    } else {
        keyboardShortcuts.showFolder();
    }
}

function setShortcuts(action: keyboardActions.setShortcuts.TAction) {
    if (action.payload.save) {
        debug("Keyboard shortcuts saving:", action.payload.shortcuts);
        keyboardShortcuts.saveUser(action.payload.shortcuts);
    } else {
        debug("Keyboard shortcuts NOT saving (defaults):" /*action.payload.shortcuts*/);
    }

}

function* keyboardReload(action: keyboardActions.reloadShortcuts.TAction) {
    if (action.payload.defaults) {
        keyboardShortcuts.loadDefaults();
    }
    const okay = action.payload.defaults || keyboardShortcuts.loadUser();

    debug(`Keyboard shortcuts reload JSON (defaults: ${/*action.payload.defaults*/""}) => ${okay}`);

    // if (DEBUG_KEYBOARD) {
    //     const jsonDiff = require("json-diff");

    //     const defaultKeyboardShortcuts = keyboardShortcuts.getAllDefaults();
    //     const json1 = sortObject(JSON.parse(JSON.stringify(defaultKeyboardShortcuts)));
    //     const json2 = sortObject(JSON.parse(JSON.stringify(currentKeyboardShortcuts)));
    //     debug(jsonDiff.diffString(json1, json2) + "\n");
    // }

    if (okay) {
        const currentKeyboardShortcuts = keyboardShortcuts.getAll();
        yield* putTyped(keyboardActions.setShortcuts.build(currentKeyboardShortcuts, true)); // !action.payload.defaults

        const translator = yield* callTyped(() => diMainGet("translator"));
        yield* putTyped(toastActions.openRequest.build(ToastType.Success,
            `${translator.translate("settings.keyboard.keyboardShortcuts")}`));
    }
}

export function saga() {
    return all([
        takeSpawnEvery(
            keyboardActions.setShortcuts.ID,
            setShortcuts,
            (e) => error(filename_ + ":setShortcuts", e),
        ),
        takeSpawnEvery(
            keyboardActions.showShortcuts.ID,
            showShortcuts,
            (e) => error(filename_ + ":showShortcuts", e),
        ),
        takeSpawnLeading(
            keyboardActions.reloadShortcuts.ID,
            keyboardReload,
            (e) => error(filename_ + ":reloadKeyboard", e),
        ),
    ]);
}
