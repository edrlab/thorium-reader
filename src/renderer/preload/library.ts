// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { clipboard, contextBridge, ipcRenderer, shell, webUtils } from "electron";

window.addEventListener("error", (event) => {
    console.error("[LibraryWindow:error]", event.message, event.filename, event.lineno, event.colno, event.error);
});

window.addEventListener("unhandledrejection", (event) => {
    console.error("[LibraryWindow:unhandledrejection]", event.reason);
});

type TIpcRendererListener = (_event: undefined, ...args: any[]) => void;

const ipcRendererListenerMap = new WeakMap<TIpcRendererListener, (...args: any[]) => void>();

const electronApi = {
    getPathForFile: (file: File): string => webUtils.getPathForFile(file),
    openExternal: (url: string): Promise<void> => shell.openExternal(url),
    clipboardWriteText: (text: string, type?: "selection" | "clipboard"): void => clipboard.writeText(text, type),
    ipcSend: (channel: string, ...args: any[]): void => ipcRenderer.send(channel, ...args),
    ipcOn: (channel: string, listener: TIpcRendererListener): void => {
        const wrappedListener = (_event: Electron.IpcRendererEvent, ...args: any[]) => listener(undefined, ...args);
        ipcRendererListenerMap.set(listener, wrappedListener);
        ipcRenderer.on(channel, wrappedListener);
    },
    ipcOnce: (channel: string, listener: TIpcRendererListener): void => {
        ipcRenderer.once(channel, (_event: Electron.IpcRendererEvent, ...args: any[]) => listener(undefined, ...args));
    },
    ipcOff: (channel: string, listener: TIpcRendererListener): void => {
        const wrappedListener = ipcRendererListenerMap.get(listener);
        if (wrappedListener) {
            ipcRenderer.off(channel, wrappedListener);
            ipcRendererListenerMap.delete(listener);
        }
    },
};

if (process.contextIsolated) {
    contextBridge.exposeInMainWorld("electronApi", electronApi);
} else {
    (window as any).electronApi = electronApi;
}
