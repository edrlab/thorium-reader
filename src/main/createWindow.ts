// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import * as debug_ from "debug";
import { app, BrowserWindow, Menu, shell, webContents } from "electron";
import * as path from "path";
import { AppWindowType } from "readium-desktop/common/models/win";
import {
    getWindowsRectangle,
} from "readium-desktop/common/rectangle/window";
import { Translator } from "readium-desktop/common/services/translator";
import { container } from "readium-desktop/main/di";
import { WinRegistry } from "readium-desktop/main/services/win-registry";
import {
    _PACKAGING, _RENDERER_APP_BASE_URL, IS_DEV,
} from "readium-desktop/preprocessor-directives";

// Logger
const debug = debug_("readium-desktop:createWindow");

// Global reference to the main window,
// so the garbage collector doesn't close it.
let mainWindow: BrowserWindow = null;

// Opens the main window, with a native menu bar.
export async function createWindow() {
    mainWindow = new BrowserWindow({
        ...(await getWindowsRectangle()),
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            devTools: IS_DEV,
            nodeIntegration: true, // Required to use IPC
            webSecurity: false,
            allowRunningInsecureContent: false,
        },
        icon: path.join(__dirname, "assets/icons/icon.png"),
    });

    if (IS_DEV) {
        mainWindow.webContents.on("context-menu", (_ev, params) => {
            const { x, y } = params;
            Menu.buildFromTemplate([{
                label: "Inspect element",
                click: () => {
                    mainWindow.webContents.inspectElement(x, y);
                },
            }]).popup({window: mainWindow});
        });
    }

    const winRegistry = container.get("win-registry") as WinRegistry;
    const appWindow = winRegistry.registerWindow(mainWindow, AppWindowType.Library);

    // watch to record window rectangle position in the db
    appWindow.onWindowMoveResize.attach();

    let rendererBaseUrl = _RENDERER_APP_BASE_URL;

    if (rendererBaseUrl === "file://") {
        // dist/prod mode (without WebPack HMR Hot Module Reload HTTP server)
        rendererBaseUrl += path.normalize(path.join(__dirname, "index_app.html"));
    } else {
        // dev/debug mode (with WebPack HMR Hot Module Reload HTTP server)
        rendererBaseUrl += "index_app.html";
    }

    rendererBaseUrl = rendererBaseUrl.replace(/\\/g, "/");

    mainWindow.loadURL(rendererBaseUrl);

    // Create the app menu on mac os to allow copy paste
    if (process.platform === "darwin") {
        initDarwin();
    }

    if (IS_DEV) {
        const {
            default: installExtension,
            REACT_DEVELOPER_TOOLS,
            REDUX_DEVTOOLS,
        } = require("electron-devtools-installer");

        [REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS].forEach((extension) => {
            installExtension(extension)
                .then((name: string) => debug("Added Extension: ", name))
                .catch((err: any) => debug("An error occurred: ", err));
        });

        // Open dev tools in development environment
        mainWindow.webContents.openDevTools();
    } else {
        // Remove menu bar
        mainWindow.setMenu(null);
    }

    // Redirect link to an external browser
    const handleRedirect = (event: any, url: any) => {
        if (url === mainWindow.webContents.getURL()) {
            return;
        }

        event.preventDefault();
        shell.openExternal(url);
    };

    mainWindow.webContents.on("will-navigate", handleRedirect);
    mainWindow.webContents.on("new-window", handleRedirect);

    // Clear all cache to prevent weird behaviours
    // Fully handled in r2-navigator-js initSessions();
    // (including exit cleanup)
    // mainWindow.webContents.session.clearStorageData();

    mainWindow.on("closed", () => {
        // note that winRegistry still contains a reference to mainWindow, so won't necessarily be garbage-collected
        mainWindow = null;
    });
}

// On OS X it's common to re-create a window in the app when the dock icon is clicked and there are no other
// windows open.
app.on("activate", async () => {
    if (mainWindow === null) {
        await createWindow();
    }
});

export function initDarwin() {
    const translator = container.get("translator") as Translator;
    const template: Electron.MenuItemConstructorOptions[] = [
        {
            label: "Thorium",
            submenu: [
                {
                    role: "togglefullscreen",
                },
                {
                    role: "minimize",
                },
                {
                    role: "close",
                },
                {
                    role: "front",
                },
                {
                    type: "separator",
                },
                {
                    role: "hide",
                },
                {
                    role: "hideothers",
                },
                {
                    role: "unhide",
                },
                {
                    type: "separator",
                },
                {
                    role: "services",
                    submenu: [],
                },
                {
                    type: "separator",
                },
                {
                    role: "quit",
                    // accelerator: "Command+Q",
                    // click: () => { app.quit(); },
                    label: translator.translate("app.quit"),
                },
            ],
        },
        {
            label: translator.translate("app.edit.title"),
            role: "edit",
            submenu: [
                {
                    role: "undo",
                    // accelerator: "CmdOrCtrl+Z",
                    // selector: "undo:",
                    label: translator.translate("app.edit.undo"),
                },
                {
                    role: "redo",
                    // accelerator: "Shift+CmdOrCtrl+Z",
                    // selector: "redo:",
                    label: translator.translate("app.edit.redo"),
                },
                {
                    type: "separator",
                },
                {
                    role: "cut",
                    // accelerator: "CmdOrCtrl+X",
                    // selector: "cut:",
                    label: translator.translate("app.edit.cut"),
                },
                {
                    role: "copy",
                    // accelerator: "CmdOrCtrl+C",
                    // selector: "copy:",
                    label: translator.translate("app.edit.copy"),
                },
                {
                    role: "paste",
                    // accelerator: "CmdOrCtrl+V",
                    // selector: "paste:",
                    label: translator.translate("app.edit.paste"),
                },
                {
                    role: "selectall",
                    // accelerator: "CmdOrCtrl+A",
                    // selector: "selectAll:",
                    label: translator.translate("app.edit.selectAll"),
                },
            ],
        },
    ];
    if (IS_DEV) {
        template.push(
            {
                label: "DEV",
                submenu: [
                    {
                        label: "RELOAD WINDOW",
                        accelerator: "CmdOrCtrl+R",
                        click: (_item: any, focusedWindow: any) => {
                            if (focusedWindow) {
                                focusedWindow.webContents.reload();
                            } else {
                                const bw = BrowserWindow.getFocusedWindow();
                                if (bw) {
                                    bw.webContents.reload();
                                } else if (mainWindow) {
                                    mainWindow.webContents.reload();
                                } else {
                                    const arr = BrowserWindow.getAllWindows();
                                    arr.forEach((bww) => {
                                        bww.webContents.reload();
                                    });
                                }
                            }
                        },
                    },
                    {
                        label: "TOGGLE DEV TOOLS",
                        accelerator: "Alt+CmdOrCtrl+I",
                        click: (_item: any, focusedWindow: any) => {
                            if (focusedWindow) {
                                focusedWindow.webContents.toggleDevTools();
                            } else {
                                const bw = BrowserWindow.getFocusedWindow();
                                if (bw) {
                                    bw.webContents.toggleDevTools();
                                } else if (mainWindow) {
                                    mainWindow.webContents.toggleDevTools();
                                } else {
                                    const arr = BrowserWindow.getAllWindows();
                                    arr.forEach((bww) => {
                                        bww.webContents.toggleDevTools();
                                    });
                                }
                            }
                        },
                    },
                    {
                        type: "separator",
                    },
                    {
                        label: "OPEN ALL DEV TOOLS",
                        accelerator: "Shift+Alt+CmdOrCtrl+I",
                        click: (_item: any, _focusedWindow: any) => {
                            const arr = BrowserWindow.getAllWindows();
                            arr.forEach((bww) => {
                                bww.webContents.openDevTools({ mode: "detach" });
                            });
                        },
                    },
                    {
                        label: "OPEN ALL R2-NAVIGATOR DEV TOOLS",
                        accelerator: "Shift+Alt+CmdOrCtrl+I",
                        click: (_item: any, _focusedWindow: any) => {
                            for (const wc of webContents.getAllWebContents()) {
                                if (wc.hostWebContents) {
                                    // wc.hostWebContents.id === readerWindow.webContents.id
                                    wc.openDevTools({ mode: "detach" });
                                }
                            }
                        },
                    },
                ],
            },
        );
    }
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
