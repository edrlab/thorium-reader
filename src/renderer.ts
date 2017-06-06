import "font-awesome/css/font-awesome.css";

import * as React from "react";
import * as ReactDOM from "react-dom";
import * as injectTapEventPlugin from "react-tap-event-plugin";

import App from "readium-desktop/components/App";

// Needed for onTouchTap
// http://stackoverflow.com/a/34015469/988941
injectTapEventPlugin();

// Render React App component
ReactDOM.render(
    React.createElement(App, {}, null),
    document.getElementById("app"),
);

