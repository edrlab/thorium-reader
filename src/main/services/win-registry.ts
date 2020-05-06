// // ==LICENSE-BEGIN==
// // Copyright 2017 European Digital Reading Lab. All rights reserved.
// // Licensed to the Readium Foundation under one or more contributor license agreements.
// // Use of this source code is governed by a BSD-style license
// // that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// // ==LICENSE-END==

// import { BrowserWindow } from "electron";
// import { injectable } from "inversify";
// import { AppWindow, AppWindowType } from "readium-desktop/common/models/win";
// import { onWindowMoveResize } from "readium-desktop/common/rectangle/window";
// import { ObjectValues } from "readium-desktop/utils/object-keys-values";
// import * as uuid from "uuid";

// // Warning: not an array with ordered indexes!
// // (cannot reliably iterate from 0 to N)
// export interface WinDictionary {
//     [winId: number]: AppWindow;
// }

// type OpenCallbackFunc = (appWindow: AppWindow) => void;
// type CloseCallbackFunc = (appWindow: AppWindow) => void;

// @injectable()
// export class WinRegistry {
//     // object map: Electron.BrowserWindow.id (number key) => AppWindow
//     // https://electronjs.org/docs/api/browser-window#winid-readonly
//     // Instead, we rely on AppWindow.registerIndex (incrementing number)
//     // to have a record of creation/registration stacking order
//     private windows: WinDictionary;
//     // getAllWindows() and getReaderWindows() use AppWindow.registerIndex for ordering
//     private _lastRegisterIndex = -1;

//     private openCallbacks: OpenCallbackFunc[];
//     private closeCallbacks: CloseCallbackFunc[];

//     constructor() {
//         this.windows = {};

//         this.unregisterWindow = this.unregisterWindow.bind(this);
//         this.openCallbacks = [];
//         this.closeCallbacks = [];
//     }

//     public registerOpenCallback(callback: OpenCallbackFunc) {
//         this.openCallbacks.push(callback);
//     }

//     public registerCloseCallback(callback: CloseCallbackFunc) {
//         this.closeCallbacks.push(callback);
//     }

//     /**
//      * Register new electron browser window
//      *
//      * @param win Electron BrowserWindows
//      * @return Id of registered window
//      */
//     public registerWindow(browserWindow: BrowserWindow, type: AppWindowType): AppWindow {
//         const winId = browserWindow.id;
//         const appWindow: AppWindow = {
//             identifier: uuid.v4(),
//             type,
//             browserWindow,
//             browserWindowID: winId,
//             onWindowMoveResize: onWindowMoveResize(browserWindow),

//             // ordered registration / creation stack
//             registerIndex: ++this._lastRegisterIndex,
//         };
//         this.windows[winId] = appWindow;

//         browserWindow.webContents.on("did-finish-load", () => {
//             // Call callbacks
//             for (const callback of this.openCallbacks) {
//                 callback(appWindow);
//             }
//         });

//         // Unregister automatically
//         browserWindow.on("closed", () => {
//             this.unregisterWindow(winId);
//         });

//         return appWindow;
//     }

//     /**
//      * Unregister electron browser window
//      *
//      * @param winId Id of registered window
//      */
//     public unregisterWindow(winId: number) {
//         if (!(winId in this.windows)) {
//             // Window not found
//             return;
//         }

//         const appWindow = this.windows[winId];
//         delete this.windows[winId];

//         // Call callbacks
//         for (const callback of this.closeCallbacks) {
//             callback(appWindow);
//         }
//     }

//     public getWindowByIdentifier(identifier: string): AppWindow | undefined {
//         return ObjectValues(this.windows).find((w) => w.identifier === identifier);
//     }

//     // can return undefined when library window has been closed and unregistered
//     public getLibraryWindow(): AppWindow | undefined {
//         return ObjectValues(this.windows).find((w) => w.type === AppWindowType.Library);
//     }

//     // can return empty array, but not undefined/null
//     public getReaderWindows() {
//         return ObjectValues(this.windows).
//             filter((w) => w.type === AppWindowType.Reader).

//             // ordered registration / creation stack
//             sort((w1, w2) => w1.registerIndex - w2.registerIndex);
//     }

//     // can return empty array, but not undefined/null
//     public getAllWindows() {
//         // Array<AppWindow>
//         return ObjectValues(this.windows).

//         // ordered registration / creation stack
//         sort((w1, w2) => w1.registerIndex - w2.registerIndex);

//         // generic / template type does not work because dictionary not indexed by string, but by number:
//         // const windows = Object.values<AppWindow>(windowsDict);

//         // another style of type cohersion:
//         // const windows = Object.values(windowsDict) as AppWindow[];

//         // keys can be typed too:
//         // const keys = ObjectKeys(windowsDict); // Array<never>
//         // const keys = ObjectKeysAll(windowsDict); // Array<number>
//     }

//     // Let's not expose internals (breaks encapsulation, also confusion with array[0...n])
//     // this.windows === WinDictionary: object map of Electron.BrowserWindow.id (number key) => AppWindow
//     // public getWindowsDictionary() {
//     //     return this.windows;
//     // }
//     // public getWindow(winId: number): AppWindow {
//     //     if (!(winId in this.windows)) {
//     //         // Window not found
//     //         return undefined;
//     //     }

//     //     return this.windows[winId];
//     // }
// }
