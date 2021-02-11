// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import "reflect-metadata";

import * as path from "path";
import * as React from "react";
import { Provider } from "react-redux";
import { _NODE_MODULE_RELATIVE_URL, _PACKAGING } from "readium-desktop/preprocessor-directives";
import ToastManager from "readium-desktop/renderer/common/components/toast/ToastManager";
import { TranslatorContext } from "readium-desktop/renderer/common/translator.context";
import DialogManager from "readium-desktop/renderer/reader/components/dialog/DialogManager";
import { diReaderGet } from "readium-desktop/renderer/reader/di";

import Reader from "./Reader";

export default class App extends React.Component<{}, undefined> {

    constructor(props: {}) {
        super(props);
    }

    public render(): React.ReactElement<{}> {
        const store = diReaderGet("store");
        const translator = diReaderGet("translator");

        const readiumCssFontFaceStyleID = "readiumCssFontFaceStyleID";
        let el = document.getElementById(readiumCssFontFaceStyleID);
        if (!el) {

            let rcssPath = "ReadiumCSS";
            if (_PACKAGING === "1") {
                rcssPath = path.normalize(path.join(__dirname, rcssPath));
            } else {
                rcssPath = "r2-navigator-js/dist/ReadiumCSS";
                rcssPath = path.normalize(path.join(__dirname, _NODE_MODULE_RELATIVE_URL, rcssPath));
            }

            rcssPath = rcssPath.replace(/\\/g, "/");
            console.log("readium css path:", rcssPath);

            const css = `
@font-face {
font-family: AccessibleDfA;
font-style: normal;
font-weight: normal;
src: local("AccessibleDfA"),
url("${rcssPath}/fonts/AccessibleDfA.otf") format("opentype");
}

@font-face {
font-family: "IA Writer Duospace";
font-style: normal;
font-weight: normal;
src: local("iAWriterDuospace-Regular"),
url("${rcssPath}/fonts/iAWriterDuospace-Regular.ttf") format("truetype");
`;
            el = document.createElement("style");
            el.setAttribute("type", "text/css");
            el.appendChild(document.createTextNode(css));
            document.head.appendChild(el);
        }

        return (
            <Provider store={store}>
                <TranslatorContext.Provider value={translator}>
                    <Reader />
                    <DialogManager />
                    <ToastManager />
                </TranslatorContext.Provider>
            </Provider>
        );
    }
}
