
// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { BrowserWindow } from "electron";
import { Action } from "readium-desktop/common/models/redux";
import { ok } from "readium-desktop/common/utils/assert";
import { saveLibraryWindowInDi } from "readium-desktop/main/di";
import { uuidv4 } from "readium-desktop/utils/uuid";

export const ID = "WIN_SESSION_REGISTER_LIBRARY";

export interface Payload {
    win: BrowserWindow;
    identifier: string;
    winBound: Electron.Rectangle;
}

export function build(win: BrowserWindow, winBound: Electron.Rectangle):
    Action<typeof ID, Payload> {

    ok(win, "lib win not defined");
    saveLibraryWindowInDi(win);

    // SEE src/utils/uuid.ts
    //
    // --------
    // see tsconfig.json, and tsconfig_main/renderer.json
    // ATTTEMPT TO EXCLUDE LIB.DOM FAILS BECAUSE:
    // node_modules/xpath/xpath.d.ts
    // node_modules/@types/jsdom/base.d.ts
    // and LIB.DOM.ITERABLE:
    // node_modules/@types/jsdom/base.d.ts
    // --------
    // console.log(typeof window); // typescript/lib/lib.dom.d.ts
    // console.log(typeof document); // typescript/lib/lib.dom.d.ts
    // console.log(typeof Range); // typescript/lib/lib.dom.d.ts
    // console.log(typeof navigator); // typescript/lib/lib.dom.d.ts AND @types/node/web-globals (lib.dom and lib.webworker compatibility)
    // console.log(typeof crypto); // typescript/lib/lib.dom.d.ts AND @types/node/web-globals (lib.dom compatibility)
    // // import { performance } from "node:perf_hooks";
    // console.log(typeof performance); // typescript/lib/lib.dom.d.ts AND @types/node/perf_hooks.d.ts

    return {
        type: ID,
        payload: {
            win,
            winBound,
            identifier: uuidv4(),
        },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
