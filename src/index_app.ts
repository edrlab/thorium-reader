import "font-awesome/css/font-awesome.css";

import * as path from "path";

import { ipcRenderer } from "electron";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { Store } from "redux";

import { container } from "readium-desktop/renderer/di";
import { winInit } from "readium-desktop/renderer/redux/actions/win";
import { WinStatus } from "readium-desktop/renderer/redux/states/win";

import { syncIpc, winIpc } from "readium-desktop/common/ipc";

import App from "readium-desktop/renderer/components/App";

import { initGlobals } from "@r2-shared-js/init-globals";
// import { setLcpNativePluginPath } from "@r2-lcp-js/parser/epub/lcp";

declare const __FORCEDEBUG__: string;

if (__FORCEDEBUG__ === "1") {
    process.env.DEBUG = "r2:*";
}

initGlobals();
// const lcpNativePluginPath = path.normalize(path.join(__dirname, "external-assets", "lcp.node"));
// setLcpNativePluginPath(lcpNativePluginPath);

// Render app
let hasBeenRenderered = false;

// Render React App component
function render() {
    ReactDOM.render(
        React.createElement(App, {}, null),
        document.getElementById("app"),
    );
}
// Init redux store
const store = (container.get("store") as Store<any>);

store.subscribe(() => {
    const state = store.getState();

    if (!hasBeenRenderered && state.win.status === WinStatus.Initialized) {
        render();
        hasBeenRenderered = true;
    }
});

ipcRenderer.on(winIpc.CHANNEL, (_0: any, data: any) => {
    switch (data.type) {
        case winIpc.EventType.IdResponse:
            // Initialize window
            store.dispatch(winInit(data.payload.winId));
            break;
    }
});

// Request main process for a new id
ipcRenderer.send(winIpc.CHANNEL, {
    type: winIpc.EventType.IdRequest,
});

ipcRenderer.on(syncIpc.CHANNEL, (_0: any, data: any) => {
    switch (data.type) {
        case syncIpc.EventType.MainAction:
            // Dispatch main action to renderer reducers
            store.dispatch(data.payload.action);
            break;
    }
});
