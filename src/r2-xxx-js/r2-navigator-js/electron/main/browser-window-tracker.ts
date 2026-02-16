// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";
import { BrowserWindow, HandlerDetails, Menu, WebContentsWillNavigateEventParams, Event as ElectronEvent, app, ipcMain, webContents, shell } from "electron";

import { CONTEXT_MENU_SETUP } from "../common/context-menu";
import {
    IEventPayload_R2_EVENT_LINK, R2_EVENT_KEYBOARD_FOCUS_REQUEST, R2_EVENT_LINK,
} from "../common/events";
// import { READIUM2_ELECTRON_HTTP_PROTOCOL } from "../common/sessions";

const debug = debug_("r2:navigator#electron/main/browser-window-tracker");

let _electronBrowserWindows: Electron.BrowserWindow[];

// let _serverURL: string | undefined;

export function trackBrowserWindow(win: Electron.BrowserWindow, _serverURL?: string) {

    // _serverURL = serverURL;

    if (!_electronBrowserWindows) {
        _electronBrowserWindows = [];
    }
    _electronBrowserWindows.push(win);

    win.on("closed", () => {
        const i = _electronBrowserWindows.indexOf(win);
        if (i < 0) {
            return;
        }
        _electronBrowserWindows.splice(i, 1);
    });
}

// app.on("accessibility-support-changed", (_ev, accessibilitySupportEnabled: boolean) => {

//     debug("accessibility-support-changed ... ", accessibilitySupportEnabled);
//     if (app.accessibilitySupportEnabled !== accessibilitySupportEnabled) {
//         debug("!!?? app.accessibilitySupportEnabled !== accessibilitySupportEnabled");
//     }

//     if (!_electronBrowserWindows || !_electronBrowserWindows.length) {
//         return;
//     }
//     _electronBrowserWindows.forEach((win) => {
//         if (win.webContents) {
//             debug("accessibility-support-changed event to WebViewContents ", accessibilitySupportEnabled);
//             win.webContents.send("accessibility-support-changed", accessibilitySupportEnabled);
//         }

//         // const allWebContents = webContents.getAllWebContents();
//         // if (allWebContents && allWebContents.length) {
//         //     for (const wc of allWebContents) {
//         //         if (!wc.hostWebContents) {
//         //             continue;
//         //         }
//         //         if (wc.hostWebContents.id === win.webContents.id) {
//         //             // NOPE
//         //         }
//         //     }
//         // }
//     });
// });
// ipcMain.on("accessibility-support-changed", (ev) => {
//     const accessibilitySupportEnabled = app.accessibilitySupportEnabled;
//     debug("accessibility-support-changed REQUEST, sending to WebViewContents ", accessibilitySupportEnabled);
//     ev.sender.send("accessibility-support-changed", accessibilitySupportEnabled);
// });

export const contextMenuSetup = (webContent: Electron.WebContents, webContentID: number) => {

    debug(`MAIN CONTEXT_MENU_SETUP ${webContentID}`);

    // const wc = remote.webContents.fromId(wv.getWebContentsId());
    // const wc = wv.getWebContents();
    const wc = webContents.fromId(webContentID);
    if (!wc) {
        return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((wc as any).__CONTEXT_MENU_SETUP) {
        return;
    }

    // This is always the case: webContentID is the inner WebView
    // inside the main reader BrowserWindow (webContent === event.sender)
    // if (wc !== webContent) {
    //     debug(`!!!!?? CONTEXT_MENU_SETUP __ wc ${wc.id} !== webContent ${webContentID}`);
    // }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (wc as any).__CONTEXT_MENU_SETUP = true;
    wc.on("context-menu", (_ev, params) => {
        const { x, y } = params;
        debug("MAIN context-menu EVENT on WebView");

        const win = BrowserWindow.fromWebContents(webContent) || undefined;

        const openDevToolsAndInspect = () => {
            const devToolsOpened = () => {
                wc.off("devtools-opened", devToolsOpened);
                wc.inspectElement(x, y);

                setTimeout(() => {
                    if (wc.devToolsWebContents && wc.isDevToolsOpened()) {
                        wc.devToolsWebContents.focus();
                    }
                }, 500);
            };
            wc.on("devtools-opened", devToolsOpened);
            wc.openDevTools({ activate: true, mode: "detach" });
        };
        Menu.buildFromTemplate([{
            click: () => {
                const wasOpened = wc.isDevToolsOpened();
                if (!wasOpened) {
                    openDevToolsAndInspect();
                } else {
                    if (!wc.isDevToolsFocused()) {
                        // wc.toggleDevTools();
                        wc.closeDevTools();

                        setImmediate(() => {
                            openDevToolsAndInspect();
                        });
                    } else {
                        // right-click context menu normally occurs when focus
                        // is in BrowserWindow / WebView's WebContents,
                        // but some platforms (e.g. MacOS) allow mouse interaction
                        // when the window is in the background.
                        wc.inspectElement(x, y);
                    }
                }
            },
            label: "Inspect element",
        }]).popup({window: win});
    });
};
ipcMain.on(CONTEXT_MENU_SETUP, (event, webContentID: number) => {
    contextMenuSetup(event.sender, webContentID);
});

// +R2_EVENT_KEYBOARD_FOCUS_REQUEST
ipcMain.handle(R2_EVENT_KEYBOARD_FOCUS_REQUEST, (event, webContentsId) => {
    const wc = webContents.fromId(webContentsId);
    if (!wc) {
        return;
    }
    debug("KEYBOARD FOCUS REQUEST (3) ", wc ? wc.id : "??", " // ", webContentsId, " -- ", wc.hostWebContents.id, " == ", event.sender.id);
    if (wc && wc.hostWebContents === event.sender) {
        debug("KEYBOARD FOCUS REQUEST (3) GO! ", wc.id, wc.hostWebContents.id);
        wc.focus();
    }
});

// https://github.com/electron/electron/blob/master/docs/tutorial/security.md#how-9
app.on("web-contents-created", (_evt, wc) => {
    debug("app.on('web-contents-created')", wc.id);

    wc.on("will-attach-webview", (_event, webPreferences, params) => {
        debug("app.on('web-contents-created') ==> webContents.on('will-attach-webview')");

        if (params.src && !params.src.startsWith("data:")) {
            debug(params.src);
        }
        debug(webPreferences);

        // delete webPreferences.preload;
        // delete webPreferences.preloadURL;

        // webPreferences.contextIsolation = true;
        // webPreferences.javascript = true;
        // webPreferences.webSecurity = true;
        // webPreferences.nodeIntegration = false;
        // webPreferences.nodeIntegrationInWorker = false;
        // webPreferences.allowRunningInsecureContent = false;
        // webPreferences.partition = R2_SESSION_WEBVIEW;

        // works in Electron v3 because webPreferences is any instead of WebPreferences
        // webPreferences.enableRemoteModule = false;

        // TODO: prevent loading remote publications?
        // const fail = !params.src.startsWith(READIUM2_ELECTRON_HTTP_PROTOCOL + "://") &&
        //     (_serverURL ? !params.src.startsWith(_serverURL) :
        //         !(/^https?:\/\/127\.0\.0\.1/.test(params.src))
        //         // (!params.src.startsWith("https://127.0.0.1") && !params.src.startsWith("http://127.0.0.1"))
        //         );

        // if (fail) {
        //     debug("WEBVIEW will-attach-webview FAIL: " + params.src);
        //     event.preventDefault();
        // }
    });

    if (!wc.hostWebContents) {
        debug("app.on('web-contents-created') ==> !webContents.hostWebContents (skip)");
        return;
    }

    if (!_electronBrowserWindows?.length) {
        debug("app.on('web-contents-created') ==> !_electronBrowserWindows?.length (skip)");
        return;
    }
    _electronBrowserWindows.forEach((win) => {
        if (wc.hostWebContents.id === win.webContents.id) {
            debug("app.on('web-contents-created') ==> webContents.hostWebContents.id === _electronBrowserWindows[x].webContents.id", win.webContents.id);

            const willNavigate = (navUrl: string | undefined | null) => {

                if (!navUrl) {
                    debug("willNavigate ==> nil: ", navUrl);
                    return;
                }

                if (
                    // (
                    // win.webContents.getURL().startsWith("thoriumhttps" + "://") PARENT BrowserWindow (reader)
                    // ||
                    wc.getURL().startsWith("thoriumhttps" + "://") // CHILD NESTED WebView (PDF is served, not EPUB which is READIUM2_ELECTRON_HTTP_PROTOCOL + "://")
                    // )
                    &&
                    /^https?:\/\//.test(navUrl)) { // ignores file: mailto: data: thoriumhttps: httpsr2: thorium: opds: etc.

                    debug("willNavigate ==> EXTERNAL: ", win.webContents.getURL(), " --- ", wc.getURL(), " *** ", navUrl);
                    setTimeout(async () => {
                        await shell.openExternal(navUrl);
                    }, 0);

                    return;
                }

                debug("willNavigate ==> R2_EVENT_LINK: ", navUrl);
                const payload: IEventPayload_R2_EVENT_LINK = {
                    url: navUrl,
                };
                // ipcMain.emit
                win.webContents.send(R2_EVENT_LINK, payload);
            };

            wc.setWindowOpenHandler((details: HandlerDetails) => {
                debug("app.on('web-contents-created') ==> webContents.hostWebContents.id === _electronBrowserWindows[x].webContents.id ==> webContents.setWindowOpenHandler (always DENY): ", win.webContents.id, " --- ", details.url, " === ", win.webContents.getURL(), " +++ ", wc.getURL());

                // if (details.url === win.webContents.getURL()) {
                //     return { action: "allow" };
                // }

                willNavigate(details.url);

                return { action: "deny" };
            });

            wc.on("will-navigate", (details: ElectronEvent<WebContentsWillNavigateEventParams>, url: string) => {
                debug("app.on('web-contents-created') ==> webContents.hostWebContents.id === _electronBrowserWindows[x].webContents.id ==> webContents.on('will-navigate') (always PREVENT): ", win.webContents.id, " --- ", details.url, " *** ", url, " === ", win.webContents.getURL(), " +++ ", wc.getURL());

                details.preventDefault();

                // Note that event.stopPropagation() and event.url
                // only exists on WebView `will-navigate` event,
                // but not WebContents! However the WebView event.preventDefault() does NOT prevent link loading!
                // https://www.electronjs.org/docs/api/webview-tag#event-will-navigate
                // vs.:
                // https://www.electronjs.org/docs/api/web-contents#event-will-navigate
                // TODO: see if we can intercept `will-navigate` in the renderer process
                // directly where WebView elements are created. Perhaps the infinite loop problem
                // (see below) does not occur in this alternative context.

                // unfortunately 'will-navigate' enters an infinite loop with HTML <base href="HTTP_URL" /> ! :(
                // so we check for the no-HTTP streamer scheme/custom protocol
                // (which doesn't transform the HTML base URL)

                // if (!details.url ||
                //     (!details.url.startsWith("thoriumhttps" + "://") &&
                //     !details.url.startsWith(READIUM2_ELECTRON_HTTP_PROTOCOL + "://"))) {

                //     debug("willNavigate ==> SKIP: ", details.url);
                //     return;
                // }

                willNavigate(details.url);
            });
        }
    });
});
