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
    for (const id in obj) {
        // just good practice
        if (!obj.hasOwnProperty(id)) {
            continue;
        }
        obj[id as TKeyboardShortcutId] = Object.freeze<TKeyboardShortcut>(obj[id as TKeyboardShortcutId]);
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
    shell.openItem(folderPath);
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
    const json = JSON.parse(txt); // can throw!

    const obj = cloneDefaults();
    for (const id in json) {
        // just good practice
        if (!json.hasOwnProperty(id)) {
            continue;
        }
        // filters out non-recognised names
        if (!defaults[id as TKeyboardShortcutId]) {
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
        };

        // replaces the default
        obj[id as TKeyboardShortcutId] = s;
    }
    return Object.freeze<TKeyboardShortcutsMapReadOnly>(obj);
}
function loadUser(): boolean {
    let obj: TKeyboardShortcutsMapReadOnly | undefined;
    try {
        obj = load(USER_FILENAME);
    } catch (err) {
        console.log(err);
        return false;
    }
    if (!obj) {
        return false;
    }
    current = obj;
    return  true;
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
        const txt = JSON.stringify(defaults, null, 4);
        fs.writeFileSync(defaultsFilePath, txt, { encoding: "utf8" });
    }

    // preserve existing user-defined data
    if (!fs.existsSync(userFilePath)) {
        const txt = JSON.stringify(defaults, null, 4);
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
    showFolder,
    showDefaultFile,
    showUserFile,
});
