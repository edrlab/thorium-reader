import * as React from "react";
import * as ReactDOM from "react-dom";

import App from "./components/App";

ReactDOM.render(
    React.createElement(App, {}, null),
    document.getElementById("app"),
);
