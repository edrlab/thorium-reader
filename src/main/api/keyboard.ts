// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { injectable } from "inversify";
import { IKeyboardApi } from "readium-desktop/common/api/interface/keyboardApi.interface";
import { TKeyboardShortcutsMapReadOnly } from "readium-desktop/common/keyboard";

import { keyboardShortcuts } from "../keyboard";

// import * as debug_ from "debug";
// Logger
// const debug = debug_("readium-desktop:src/main/api/opds");

@injectable()
export class KeyboardApi implements IKeyboardApi {
    public async getAll(): Promise<TKeyboardShortcutsMapReadOnly> {
        return Promise.resolve(keyboardShortcuts.getAll());
    }
}
