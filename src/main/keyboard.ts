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
    _defaults, TKeyboardShortcut, TKeyboardShortcutId, TKeyboardShortcutReadOnly,
    TKeyboardShortcutsMap, TKeyboardShortcutsMapReadOnly,
} from "../common/keyboard";

const debug = debug_("readium-desktop:keyboard");

const defaults: TKeyboardShortcutsMapReadOnly = _defaults;

let current: TKeyboardShortcutsMapReadOnly;
reset();

function cloneDefaults(): TKeyboardShortcutsMap {
    // TODO: better deep clone with recursive freeze
    const obj = JSON.parse(JSON.stringify(defaults)) as TKeyboardShortcutsMap;
    const ids = ObjectKeys(obj);
    for (const id of ids) {
        obj[id] = Object.freeze<TKeyboardShortcut>(obj[id]);
    }
    return obj;
}
function reset(): TKeyboardShortcutsMapReadOnly {
    current = Object.freeze<TKeyboardShortcutsMap>(cloneDefaults());
    return current;
}

function get(id: TKeyboardShortcutId): TKeyboardShortcutReadOnly {
    return current[id];
}
function getDefault(id: TKeyboardShortcutId): TKeyboardShortcutReadOnly {
    return defaults[id];
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
const USER_FILENAME = "user.json";
const userFilePath = path.join(
    folderPath,
    USER_FILENAME,
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

function load(fileName: string): TKeyboardShortcutsMapReadOnly | undefined {
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
        if (!defaults[id]) {
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
        if (!json[id].key) {
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
    return Object.freeze<TKeyboardShortcutsMapReadOnly>(obj);
}
function loadUser(): boolean {
    let obj: TKeyboardShortcutsMapReadOnly | undefined;
    try {
        obj = load(USER_FILENAME);
    } catch (err) {
        debug(err);
        return false;
    }
    if (!obj) {
        return false;
    }
    current = obj;
    return  true;
}
function saveUser(obj: TKeyboardShortcutsMapReadOnly) {
    const txt = JSON.stringify(sortObject(obj), null, 4);
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
        const txt = JSON.stringify(sortObject(defaults), null, 4);
        fs.writeFileSync(defaultsFilePath, txt, { encoding: "utf8" });
    }

    // preserve existing user-defined data
    if (!fs.existsSync(userFilePath)) {
        const txt = JSON.stringify(sortObject(defaults), null, 4);
        fs.writeFileSync(userFilePath, txt, { encoding: "utf8" });
    } else {
        const okay = loadUser();
        debug(`Keyboard shortcuts from user (${okay}):`, JSON.stringify(current, null, 4));
    }
}
// init();
// process.nextTick(() => {
// });

export const keyboardShortcuts = Object.freeze({
    init,
    get,
    getAll: () => {
        return current;
    },
    getDefault,
    getAllDefaults: () => {
        return defaults;
    },
    loadUser,
    loadDefaults: () => {
        reset();
    },
    saveUser,
    showFolder,
    showDefaultFile,
    showUserFile,
});
