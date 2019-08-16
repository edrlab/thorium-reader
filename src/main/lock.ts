// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { app } from "electron";
import { container } from "readium-desktop/main/di";
import { WinRegistry } from "readium-desktop/main/services/win-registry";

export function lockInstance() {
    const gotTheLock = app.requestSingleInstanceLock();

    if (!gotTheLock) {
        app.quit();
        return true;
    } else {
        app.on("second-instance", () => {
            // Someone tried to run a second instance, we should focus our window.

            const winRegistry = container.get("win-registry") as WinRegistry;
            const win = winRegistry.getWindow(1);
            if (win && win.win) {
                if (win.win.isMinimized()) {
                    win.win.restore();
                }
                win.win.focus();
            }
        });
    }
    return false;
}
