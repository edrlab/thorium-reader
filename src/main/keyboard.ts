// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { app, shell } from "electron";
import * as fs from "fs";
import * as path from "path";
import { ObjectKeys } from "readium-desktop/utils/object-keys-values";

import { sortObject } from "@r2-utils-js/_utils/JsonUtils";

import {
    defaultKeyboardShortcuts, TKeyboardShortcut, TKeyboardShortcutId,
    TKeyboardShortcutsMap,
} from "../common/keyboard";

// uncomment this to test webpack-loader-scope-checker.js (violation: MAIN calls RENDERER code => WebPack bundles source tree from different realm)
// import { unregisterKeyboardListener } from "readium-desktop/renderer/common/keyboard";
// unregisterKeyboardListener(() => { });

const debug = debug_("readium-desktop:keyboard");

let _current: TKeyboardShortcutsMap;
reset();

function cloneDefaults(): TKeyboardShortcutsMap {
    const obj = JSON.parse(JSON.stringify(defaultKeyboardShortcuts)) as TKeyboardShortcutsMap;
    // const ids = ObjectKeys(obj);
    // for (const id of ids) {
    //     obj[id] = obj[id] as TKeyboardShortcutFull;
    // }
    return obj;
}
function reset(): TKeyboardShortcutsMap {
    _current = cloneDefaults();

    // NOT NEEDED because userland calls to loadDefaults() or loadUser() are in code logic that triggers Redux Saga takeSpawnEvery keyboardActions.setShortcuts.ID
    // // saveUser(_current);
    // const txt = JSON.stringify({}, null, 4);
    // fs.writeFileSync(userFilePath, txt, { encoding: "utf8" });

    return _current;
}

function get(id: TKeyboardShortcutId): TKeyboardShortcut {
    return _current[id];
}
function getDefault(id: TKeyboardShortcutId): TKeyboardShortcut {
    return defaultKeyboardShortcuts[id];
}

const userDataPath = app.getPath("userData");
const folderPath = path.join(
    userDataPath,
    "keyboardShortcuts",
);
const DEFAULTS_FILENAME = "defaults.json";
const defaultsFilePath = path.join(
    folderPath,
    DEFAULTS_FILENAME,
);
const USER_FILENAME = "user_.json";
const userFilePath = path.join(
    folderPath,
    USER_FILENAME,
);
const USER_FILENAME_OLD = "user.json";
const userFilePath_OLD = path.join(
    folderPath,
    USER_FILENAME_OLD,
);

function showFolder() {
    setTimeout(async () => {
        await shell.openPath(folderPath);
    }, 0);
}
function showDefaultFile() {
    shell.showItemInFolder(defaultsFilePath);
}
function showUserFile() {
    shell.showItemInFolder(userFilePath);
}

function load(fileName: string): TKeyboardShortcutsMap | undefined {
    const filePath = path.join(
        folderPath,
        fileName,
    );
    if (!fs.existsSync(filePath)) {
        return undefined;
    }
    const txt = fs.readFileSync(filePath, { encoding: "utf8" });
    const json = JSON.parse(txt) as TKeyboardShortcutsMap; // can throw!
    const ids = ObjectKeys(json);

    const obj = cloneDefaults();
    for (const id of ids) {
        // filters out non-recognised names
        if (!defaultKeyboardShortcuts[id]) {
            continue;
        }

        // filters out null object
        if (!json[id]) {
            continue;
        }
        // filters out non-object values
        if (typeof json[id] !== "object") {
            continue;
        }
        // filters out objects with missing key (the rest is optional)
        if (!json[id].key || typeof json[id].key !== "string") {
            continue;
        }
        const s: TKeyboardShortcut = {
            key: json[id].key,

            alt: typeof json[id].alt !== "undefined" && json[id].alt ? true : false,
            control: typeof json[id].control !== "undefined" && json[id].control ? true : false,
            shift: typeof json[id].shift !== "undefined" && json[id].shift ? true : false,
            meta: typeof json[id].meta !== "undefined" && json[id].meta ? true : false,
        };

        // replaces the default
        obj[id] = s;
    }
    return obj;
}
function loadUser(): boolean {
    let obj: TKeyboardShortcutsMap | undefined;
    try {
        obj = load(USER_FILENAME);
    } catch (err) {
        debug(err);
        return false;
    }
    if (!obj) {
        return false;
    }
    _current = obj;
    return  true;
}
function saveUser(obj: TKeyboardShortcutsMap) {
    const objUser = {} as TKeyboardShortcutsMap;
    const defaultKeys = ObjectKeys(defaultKeyboardShortcuts); // Object.keys(defaultKeyboardShortcuts) as Array<keyof TKeyboardShortcutsMap>;
    for (const defaultKey of defaultKeys) {
        if (obj[defaultKey] &&
            obj[defaultKey].key && typeof obj[defaultKey].key === "string" &&
            // typeof obj[defaultKey].meta === "boolean" &&
            // typeof obj[defaultKey].shift === "boolean" &&
            // typeof obj[defaultKey].control === "boolean" &&
            // typeof obj[defaultKey].alt === "boolean" &&
            (
                obj[defaultKey].key !== defaultKeyboardShortcuts[defaultKey].key ||
                (obj[defaultKey].meta ? true : false) !== defaultKeyboardShortcuts[defaultKey].meta ||
                (obj[defaultKey].shift ? true : false) !== defaultKeyboardShortcuts[defaultKey].shift ||
                (obj[defaultKey].control ? true : false) !== defaultKeyboardShortcuts[defaultKey].control ||
                (obj[defaultKey].alt ? true : false) !== defaultKeyboardShortcuts[defaultKey].alt
            )
        ) {
            objUser[defaultKey] = {
                key: obj[defaultKey].key,
                meta: obj[defaultKey].meta,
                shift: obj[defaultKey].shift,
                control: obj[defaultKey].control,
                alt: obj[defaultKey].alt,
            };
        }
    }
    const txt = JSON.stringify(sortObject(objUser), null, 4);
    fs.writeFileSync(userFilePath, txt, { encoding: "utf8" });
}

function init() {
    if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath);
    }

    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
    }

    // always recreate at launch (ensures no mistaken tampering by users)
    if (true || !fs.existsSync(defaultsFilePath)) {
        const txt = JSON.stringify(sortObject(defaultKeyboardShortcuts), null, 4);
        fs.writeFileSync(defaultsFilePath, txt, { encoding: "utf8" });
    }

    if (fs.existsSync(userFilePath_OLD)) {
        try {
            fs.unlinkSync(userFilePath_OLD);
        } catch (e) {
            debug(userFilePath_OLD);
            debug(e);
        }
    }

    // preserve existing user-defined data
    if (!fs.existsSync(userFilePath)) {
        // const txt = JSON.stringify(sortObject(defaults), null, 4);
        const txt = JSON.stringify({}, null, 4);
        fs.writeFileSync(userFilePath, txt, { encoding: "utf8" });
    } else {
        const okay = loadUser();
        debug(`Keyboard shortcuts from user (${okay}):` /*, JSON.stringify(current, null, 4)*/);
    }
}
// init();
// process.nextTick(() => {
// });

export const keyboardShortcuts = {
    init,
    get,
    getAll: () => {
        return _current;
    },
    getDefault,
    getAllDefaults: () => {
        return defaultKeyboardShortcuts;
    },
    loadUser,
    loadDefaults: () => {
        reset();
    },
    saveUser,
    showFolder,
    showDefaultFile,
    showUserFile,
};
