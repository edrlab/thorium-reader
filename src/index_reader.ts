// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import "font-awesome/css/font-awesome.css";
import "react-dropdown/style.css";

import { ipcRenderer } from "electron";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { syncIpc, winIpc } from "readium-desktop/common/ipc";
import { ActionWithSender } from "readium-desktop/common/models/sync";
import { IS_DEV } from "readium-desktop/preprocessor-directives";
import App from "readium-desktop/renderer/components/reader/App";
import { diRendererGet } from "readium-desktop/renderer/di";
import { winActions } from "readium-desktop/renderer/redux/actions/";
import { WinStatus } from "readium-desktop/renderer/redux/states/win";

import { initGlobalConverters_OPDS } from "@r2-opds-js/opds/init-globals";
import {
    initGlobalConverters_GENERIC, initGlobalConverters_SHARED,
} from "@r2-shared-js/init-globals";

import { EventPayload } from "./common/ipc/sync";

// import { setLcpNativePluginPath } from "@r2-lcp-js/parser/epub/lcp";

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

// Init redux store
const store = diRendererGet("store");

// Render React App component
function render() {
    ReactDOM.render(
        React.createElement(App, {}, null),
        document.getElementById("app"),
    );
}

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
ipcRenderer.on(syncIpc.CHANNEL, (_0: any, data: EventPayload) => {
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
        const publicationViewport = document.getElementById("publication_viewport");
        let parent: Element | undefined;
        if (publicationViewport) {
            parent = publicationViewport.parentElement; // .publication_viewport_container
            if (parent) {
                publicationViewport.remove();
            }
        }

        const reloadLink = document.createElement("div");
        reloadLink.setAttribute("onClick", "javascript:window.location.reload();");
        const reloadText = document.createTextNode("REACT AXE A11Y CHECKER RUNNING (CLICK TO RESET)");
        reloadLink.appendChild(reloadText);
        // tslint:disable-next-line: max-line-length
        reloadLink.setAttribute("style", "background-color: #e2f9fe; cursor: pointer; display: flex; align-items: center; justify-content: center; text-decoration: underline; padding: 0; margin: 0; height: 100%; font-size: 120%; font-weight: bold; font-family: arial; color: blue;");
        parent.appendChild(reloadLink);

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

        // r2-navigator-js is removed for good, until next reload.
        // setTimeout(() => {
        //     if (parent && publicationViewport) {
        //         parent.appendChild(publicationViewport);
        //     }
        // }, 1500);
    });
}
