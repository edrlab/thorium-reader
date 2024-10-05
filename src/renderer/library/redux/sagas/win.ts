// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { createRoot } from "react-dom/client";
import App from "../../components/App";

export function render() {
    // React 17 --> 18
    // https://reactjs.org/blog/2022/03/08/react-18-upgrade-guide.html#updates-to-client-rendering-apis
    // import * as ReactDOM from "react-dom";
    // ReactDOM.render()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const root = createRoot(document.getElementById("app")!);
    root.render(React.createElement(App, null));
}
