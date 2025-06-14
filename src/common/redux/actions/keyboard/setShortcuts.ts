// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { TKeyboardShortcutsMap } from "readium-desktop/common/keyboard";
import { Action } from "readium-desktop/common/models/redux";

export const ID = "SHORTCUTS_SET";

export interface Payload {
    shortcuts: TKeyboardShortcutsMap;
    save: boolean;
}

export function build(shortcuts: TKeyboardShortcutsMap, save: boolean): Action<typeof ID, Payload> {

    return {
        type: ID,
        payload: {
            shortcuts,
            save,
        },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
