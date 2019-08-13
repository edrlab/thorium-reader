import { BrowserWindow, Menu, webContents } from "electron";

import { Translator } from "readium-desktop/common/services/translator";

import { container } from "readium-desktop/main/di";

import { IS_DEV } from "readium-desktop/preprocessor-directives";

let _darwinApplicationMenuAlreadySet = false; // application-wide menu, not dependent on individual BrowserWindows

export function setMenu(win?: BrowserWindow) {
    if (process.platform === "darwin") {
        if (!_darwinApplicationMenuAlreadySet) {
            setMenuDarwin(win);
        }
        _darwinApplicationMenuAlreadySet = true;
    } else {
        setMenuWindowsLinux(win);
    }
}

function devMenu(win?: BrowserWindow): Electron.MenuItemConstructorOptions {
    return {
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
                        } else if (win) {
                            win.webContents.reload();
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
                        } else if (win) {
                            win.webContents.toggleDevTools();
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
    };
}

function setMenuWindowsLinux(win?: BrowserWindow) {
    if (IS_DEV) {
        const template: Electron.MenuItemConstructorOptions[] = [];
        if (IS_DEV) {
            template.push(devMenu(win));
        }
        // Menu.setApplicationMenu(Menu.buildFromTemplate(template));
        win.setMenu(Menu.buildFromTemplate(template));
    } else {
        win.setMenu(null);
    }
}

function setMenuDarwin(win?: BrowserWindow) {
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
        template.push(devMenu(win));
    }
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
