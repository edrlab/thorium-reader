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
import { syncIpc, winIpc } from "readium-desktop/common/ipc";
import { ActionWithSender } from "readium-desktop/common/models/sync";
import { IS_DEV } from "readium-desktop/preprocessor-directives";
import App from "readium-desktop/renderer/components/App";
import { diRendererGet } from "readium-desktop/renderer/di";
import { winActions } from "readium-desktop/renderer/redux/actions/";
import { WinStatus } from "readium-desktop/renderer/redux/states/win";

import { initGlobalConverters_OPDS } from "@r2-opds-js/opds/init-globals";
import {
    initGlobalConverters_GENERIC, initGlobalConverters_SHARED,
} from "@r2-shared-js/init-globals";

// import { setLcpNativePluginPath } from "@r2-lcp-js/parser/epub/lcp";

// import { consoleRedirect } from "@r2-navigator-js/electron/renderer/common/console-redirect";
if (IS_DEV) {
    // tslint:disable-next-line:no-var-requires
    const cr = require("@r2-navigator-js/electron/renderer/common/console-redirect");
    // const releaseConsoleRedirect =
    cr.consoleRedirect("readium-desktop:renderer:bookshelf", process.stdout, process.stderr, true);
}

let devTron: any;
let axe: any;
if (IS_DEV) {
    // tslint:disable-next-line: no-var-requires
    devTron = require("devtron");

    // tslint:disable-next-line: no-var-requires
    axe = require("react-axe");
}

initGlobalConverters_OPDS();
initGlobalConverters_SHARED();
initGlobalConverters_GENERIC();

// console.log(__dirname);
// console.log((global as any).__dirname);
// const lcpNativePluginPath = path.normalize(path.join((global as any).__dirname, "external-assets", "lcp.node"));
// setLcpNativePluginPath(lcpNativePluginPath);

if (IS_DEV) {
    setTimeout(() => {
        devTron.install();
    }, 5000);
}

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
const store = diRendererGet("store");

store.subscribe(() => {
    const state = store.getState();
    if (state.i18n && state.i18n.locale) {
        document.documentElement.setAttribute("lang", state.i18n.locale);
    }

    if (!hasBeenRenderered && state.win.status === WinStatus.Initialized) {
        render();
        hasBeenRenderered = true;
    }
});

ipcRenderer.on(winIpc.CHANNEL, (_0: any, data: winIpc.EventPayload) => {
    switch (data.type) {
        case winIpc.EventType.IdResponse:
            // Initialize window
            store.dispatch(winActions.initRequest.build(data.payload.winId));
            break;
    }
});

// Request main process for a new id
ipcRenderer.on(syncIpc.CHANNEL, (_0: any, data: syncIpc.EventPayload) => {
    const actionSerializer = diRendererGet("action-serializer");

    switch (data.type) {
        case syncIpc.EventType.MainAction:
            // Dispatch main action to renderer reducers
            store.dispatch(Object.assign(
                {},
                actionSerializer.deserialize(data.payload.action),
                {
                    sender: data.sender,
                },
            ) as ActionWithSender);
            break;
    }
});

if (IS_DEV) {
    ipcRenderer.once("AXE_A11Y", () => {
        // https://github.com/dequelabs/axe-core/blob/master/doc/API.md#api-name-axeconfigure
        const config = {
            // rules: [
            //     {
            //         id: "skip-link",
            //         enabled: true,
            //     },
            // ],
        };
        axe(React, ReactDOM, 1000, config);
    });
}
