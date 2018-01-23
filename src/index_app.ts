import "font-awesome/css/font-awesome.css";

import * as React from "react";
import * as ReactDOM from "react-dom";

import App from "readium-desktop/renderer/components/App";

// Render React App component
ReactDOM.render(
    React.createElement(App, {}, null),
    document.getElementById("app"),
);
