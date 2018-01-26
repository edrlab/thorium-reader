import "font-awesome/css/font-awesome.css";
import "react-dropdown/style.css"

import * as React from "react";
import * as ReactDOM from "react-dom";

import App from "readium-desktop/renderer/components/ReaderApp";

declare const __FORCEDEBUG__: string;

if (__FORCEDEBUG__ === "1") {
    process.env.DEBUG = "r2:*";
}

// Render React App component
ReactDOM.render(
    React.createElement(App, {}, null),
    document.getElementById("app"),
);
