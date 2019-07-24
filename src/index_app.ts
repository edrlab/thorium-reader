// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import "font-awesome/css/font-awesome.css";

import { ipcRenderer } from "electron";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { Store } from "redux";

import { container } from "readium-desktop/renderer/di";
import { winInit } from "readium-desktop/renderer/redux/actions/win";
import { WinStatus } from "readium-desktop/renderer/redux/states/win";

import { syncIpc, winIpc } from "readium-desktop/common/ipc";

import App from "readium-desktop/renderer/components/App";

import {
    initGlobalConverters_GENERIC,
    initGlobalConverters_SHARED,
} from "@r2-shared-js/init-globals";

import {
    initGlobalConverters_OPDS,
} from "@r2-opds-js/opds/init-globals";

// import { setLcpNativePluginPath } from "@r2-lcp-js/parser/epub/lcp";

import { IActionWithSender } from "readium-desktop/common/models/sync";

import { ActionSerializer } from "readium-desktop/common/services/serializer";

initGlobalConverters_OPDS();
initGlobalConverters_SHARED();
initGlobalConverters_GENERIC();

// console.log(__dirname);
// console.log((global as any).__dirname);
// const lcpNativePluginPath = path.normalize(path.join((global as any).__dirname, "external-assets", "lcp.node"));
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
ipcRenderer.on(syncIpc.CHANNEL, (_0: any, data: any) => {
    const actionSerializer = container.get("action-serializer") as ActionSerializer;

    switch (data.type) {
        case syncIpc.EventType.MainAction:
            // Dispatch main action to renderer reducers
            store.dispatch(Object.assign(
                {},
                actionSerializer.deserialize(data.payload.action),
                {sender: data.sender} as IActionWithSender,
            ));
            break;
    }
});
