// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// See the LICENSE file in the project root for more information.
// ==LICENSE-END==

import debug_ from "debug";
import { app, BrowserWindow, ipcMain } from "electron";
import { diMainGet, getAllReaderWindowFromDi, getLibraryWindowFromDi } from "readium-desktop/main/di";

const debug = debug_("readium-desktop:main:accessibilitySupport");

export function registerAccessibilitySupport() {
    const store = diMainGet("store");
    const detectedScreenReader = (enabled = app.accessibilitySupportEnabled) =>
        enabled && app.getAccessibilitySupportFeatures().includes("screenReader");

    const broadcast = (enabled = app.accessibilitySupportEnabled) => {
        const detected = detectedScreenReader(enabled);
        const optimized = detected && store.getState().screenReader.activate;
        const windows: BrowserWindow[] = [];
        try {
            const library = getLibraryWindowFromDi();
            if (library) windows.push(library);
        } catch (error) {
            debug("Library window unavailable", error);
        }
        try {
            windows.push(...(getAllReaderWindowFromDi() || []));
        } catch (error) {
            debug("Reader windows unavailable", error);
        }
        for (const win of windows) {
            try {
                if (win.isDestroyed() || win.webContents.isDestroyed()) continue;
                win.webContents.send("accessibility-support-changed", optimized);
                win.webContents.send("accessibility-support-changed-raw", detected);
            } catch (error) {
                debug("Unable to notify window", error);
            }
        }
    };

    app.on("accessibility-support-changed", (_event, enabled) => broadcast(enabled));

    // Optimization can change without an Electron accessibility event. Update
    // already-open Readers after the Redux setting has actually changed.
    let activated = store.getState().screenReader.activate;
    const unsubscribe = store.subscribe(() => {
        const nextActivated = store.getState().screenReader.activate;
        if (nextActivated === activated) return;
        activated = nextActivated;
        broadcast();
    });
    app.once("will-quit", unsubscribe);

    // Keep the existing query channels, including their synchronous return values.
    // The navigator's window tracker owns a different IPC channel.
    ipcMain.on("accessibility-support-query", (event) => {
        const optimized = detectedScreenReader() && store.getState().screenReader.activate;
        event.sender.send("accessibility-support-changed", optimized);
        event.returnValue = optimized;
    });
    ipcMain.on("accessibility-support-query-raw", (event) => {
        const detected = detectedScreenReader();
        event.sender.send("accessibility-support-changed-raw", detected);
        event.returnValue = detected;
    });

    return unsubscribe;
}
