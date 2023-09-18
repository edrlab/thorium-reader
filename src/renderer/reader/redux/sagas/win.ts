// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { diReaderGet } from "readium-desktop/renderer/reader/di";

export function render() {
    // starting point to mounting React to the DOM
    ReactDOM
        .createRoot(document.getElementById("app"))
        .render(React.createElement(diReaderGet("react-reader-app"), null));
}
