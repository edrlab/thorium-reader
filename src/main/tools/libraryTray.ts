// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { app, BrowserWindow, Menu, Tray } from "electron";
import * as path from "path";
import { settingsMinimizeLibraryToTrayIsEnabled } from "readium-desktop/common/redux/states/settings";
import { getTranslator } from "readium-desktop/common/services/translator";
import {
    _APP_NAME,
} from "readium-desktop/preprocessor-directives";

import { diMainGet, getLibraryWindowFromDi } from "../di";
import { showLibrary } from "./showLibrary";

const capitalizedAppName = _APP_NAME.charAt(0).toUpperCase() + _APP_NAME.substring(1);

let libraryTray: Tray | undefined;
let trayCleanupRegistered = false;
let trayHintShown = false;
let settingsUnsubscribe: (() => void) | undefined;
const registeredLibraryWindows = new WeakSet<BrowserWindow>();

const isWindows = () => process.platform === "win32";

const isWindowsLibraryTrayEnabled = () => {
    try {
        return settingsMinimizeLibraryToTrayIsEnabled(diMainGet("store").getState().settings);
    } catch {
        return false;
    }
};

const buildTrayMenu = () => {
    const translator = getTranslator();

    return Menu.buildFromTemplate([
        {
            label: translator.translate("app.window.showLibrary"),
            click: () => showLibrary(),
        },
        {
            type: "separator",
        },
        {
            label: translator.translate("app.quit", { appName: capitalizedAppName }),
            click: () => app.quit(),
        },
    ]);
};

const getTrayTooltip = () => {
    const translator = getTranslator();

    return translator.translate("app.window.trayTooltip", { appName: capitalizedAppName });
};

const showWindowsLibraryTrayHint = () => {
    if (trayHintShown || !libraryTray || libraryTray.isDestroyed()) {
        return;
    }

    trayHintShown = true;

    try {
        const translator = getTranslator();
        libraryTray.displayBalloon({
            title: capitalizedAppName,
            content: translator.translate("app.window.trayHint", { appName: capitalizedAppName }),
            iconType: "info",
            largeIcon: true,
            noSound: true,
            respectQuietTime: true,
        });
    } catch {
        // noop
    }
};

const destroyWindowsLibraryTray = () => {
    if (libraryTray && !libraryTray.isDestroyed()) {
        libraryTray.destroy();
    }
    libraryTray = undefined;
};

const cleanupWindowsLibraryTray = () => {
    destroyWindowsLibraryTray();

    if (settingsUnsubscribe) {
        settingsUnsubscribe();
        settingsUnsubscribe = undefined;
    }
};

const ensureWindowsLibraryTraySettingsObserver = () => {
    if (!isWindows() || settingsUnsubscribe) {
        return;
    }

    try {
        let wasEnabled = isWindowsLibraryTrayEnabled();
        settingsUnsubscribe = diMainGet("store").subscribe(() => {
            const enabled = isWindowsLibraryTrayEnabled();
            if (wasEnabled && !enabled) {
                destroyWindowsLibraryTray();
            }
            wasEnabled = enabled;
        });
    } catch {
        // noop
    }
};

const toggleLibraryVisibility = () => {
    if (!isWindowsLibraryTrayEnabled()) {
        destroyWindowsLibraryTray();
        showLibrary();
        return;
    }

    try {
        const libraryWindow = getLibraryWindowFromDi();
        if (libraryWindow &&
            !libraryWindow.isDestroyed() &&
            !libraryWindow.webContents.isDestroyed() &&
            libraryWindow.isVisible() &&
            !libraryWindow.isMinimized()) {

            libraryWindow.hide();
            return;
        }
    } catch {
        // noop
    }

    showLibrary();
};

const ensureWindowsLibraryTray = () => {
    if (!isWindows() || !isWindowsLibraryTrayEnabled()) {
        return undefined;
    }

    if (!libraryTray || libraryTray.isDestroyed()) {
        libraryTray = new Tray(path.join(__dirname, "assets/icons/icon.ico"));
        libraryTray.on("click", toggleLibraryVisibility);
    }

    libraryTray.setToolTip(getTrayTooltip());
    libraryTray.setContextMenu(buildTrayMenu());

    if (!trayCleanupRegistered) {
        app.on("will-quit", cleanupWindowsLibraryTray);
        trayCleanupRegistered = true;
    }

    return libraryTray;
};

export const registerWindowsLibraryTray = (libraryWindow: BrowserWindow) => {
    if (!isWindows() || registeredLibraryWindows.has(libraryWindow)) {
        return;
    }

    ensureWindowsLibraryTraySettingsObserver();
    registeredLibraryWindows.add(libraryWindow);

    libraryWindow.on("minimize", () => {
        const tray = ensureWindowsLibraryTray();
        if (tray && !libraryWindow.isDestroyed()) {
            libraryWindow.hide();
            showWindowsLibraryTrayHint();
        }
    });

    libraryWindow.once("closed", () => {
        registeredLibraryWindows.delete(libraryWindow);
    });
};
