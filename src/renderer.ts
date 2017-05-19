import "font-awesome/css/font-awesome.css";

import { ipcRenderer } from "electron";

import * as React from "react";
import * as ReactDOM from "react-dom";
import * as injectTapEventPlugin from "react-tap-event-plugin";

import {
    CATALOG_GET_REQUEST,
    CATALOG_GET_RESPONSE,
} from "readium-desktop/events/ipc";
import { CatalogMessage } from "readium-desktop/models/ipc";

import App from "readium-desktop/components/App";

// Needed for onTouchTap
// http://stackoverflow.com/a/34015469/988941
injectTapEventPlugin();

// Get catalog async
ipcRenderer.send(CATALOG_GET_REQUEST);

ipcRenderer.on(CATALOG_GET_RESPONSE, (event: any, msg: CatalogMessage) => {
    console.log(msg);
});

// Render React App component
ReactDOM.render(
    React.createElement(App, {}, null),
    document.getElementById("app"),
);
