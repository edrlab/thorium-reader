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
import {
    _NODE_MODULE_RELATIVE_URL, _PACKAGING, _RENDERER_READER_BASE_URL,
} from "readium-desktop/preprocessor-directives";
import ToastManager from "readium-desktop/renderer/common/components/toast/ToastManager";
import { TranslatorContext } from "readium-desktop/renderer/common/translator.context";
import { diReaderGet } from "readium-desktop/renderer/reader/di";

// TODO: remove from folder too? Why different than App.tsx for library window?
// import Nunito from "readium-desktop/renderer/assets/fonts/nunito.ttf";
// import NunitoBold from "readium-desktop/renderer/assets/fonts/nunitoBold.ttf";
import Nunito from "readium-desktop/renderer/assets/fonts/NunitoSans_10pt-Regular.ttf";
import NunitoBold from "readium-desktop/renderer/assets/fonts/NunitoSans_10pt-SemiBold.ttf";

import * as globalScssStyle from "readium-desktop/renderer/assets/styles/global.scss";
globalScssStyle.__LOAD_FILE_SELECTOR_NOT_USED_JUST_TO_TRIGGER_WEBPACK_SCSS_FILE__;

import Reader from "./Reader";

export default class App extends React.Component<{}, undefined> {

    constructor(props: {}) {
        super(props);
    }

    public render(): React.ReactElement<{}> {
        const store = diReaderGet("store");
        const translator = diReaderGet("translator");

        try {
            const readiumCssFontFaceStyleID = "readiumCssFontFaceStyleID";
            let el = document.getElementById(readiumCssFontFaceStyleID);
            if (!el) {

                let rcssPath = "ReadiumCSS";
                if (_PACKAGING === "1") {
                    rcssPath = "file://" + path.normalize(path.join((global as any).__dirname, rcssPath));
                } else {
                    rcssPath = "r2-navigator-js/dist/ReadiumCSS";

                    if (_RENDERER_READER_BASE_URL === "file://") {

                        // dist/prod mode (without WebPack HMR Hot Module Reload HTTP server)
                        rcssPath = "file://" +
                            path.normalize(path.join((global as any).__dirname, _NODE_MODULE_RELATIVE_URL, rcssPath));
                    } else {
                        // dev/debug mode (with WebPack HMR Hot Module Reload HTTP server)

                        // CSP Content Security Policy for loading fonts from file://
                        // rcssPath = "file://" + path.normalize(path.join(process.cwd(), "node_modules", rcssPath));

                        // HTTP localhost:port
                        // rcssPath = _RENDERER_READER_BASE_URL + "dist/ReadiumCSS";

                        // static server (WebPack publicPath)
                        // rcssPath = "/dist/ReadiumCSS";
                        rcssPath = "/node_modules/" + rcssPath;
                    }
                }
                rcssPath = rcssPath.replace(/\\/g, "/");
                console.log("readium css path:",
                    rcssPath, _PACKAGING, _NODE_MODULE_RELATIVE_URL, _RENDERER_READER_BASE_URL);

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
}

        `;
                el = document.createElement("style");
                el.setAttribute("id", readiumCssFontFaceStyleID);
                el.setAttribute("type", "text/css");
                el.appendChild(document.createTextNode(css));
                document.head.appendChild(el);
            }
        } catch (e) {
            console.log("PROBLEM LOADING READER FONT FACE? ", e);
        }

        // FIXME: try a better way to import Nunito in CSS font face instead of in React render function.
        // One possibility is to add css font in ejs html template file from webpack
        try {
            const nunitoFontStyleID = "nunitoFontStyleID";
            const el = document.getElementById(nunitoFontStyleID);
            if (!el) {
                const css = `
@font-face {
    font-family: "Nunito";
    font-style: normal;
    font-weight: normal;
    src: local("Nunito"),
    url("${Nunito}") format("truetype");
}
@font-face {
    font-family: "Nunito";
    font-style: bold;
    font-weight: 700;
    src: local("NunitoBold"),
    url("${NunitoBold}") format("truetype");
}

                `;
                const el = document.createElement("style");
                el.setAttribute("id", nunitoFontStyleID);
                el.setAttribute("type", "text/css");
                el.appendChild(document.createTextNode(css));
                document.head.appendChild(el);
            }
        } catch (e) {
            console.error("Nunito font face error", e);
        }

        return (
            <Provider store={store}>
                <TranslatorContext.Provider value={translator}>
                    <Reader />
                    <ToastManager />
                </TranslatorContext.Provider>
            </Provider>
        );
    }
}
