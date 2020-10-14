// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { app } from "electron";
import * as express from "express";
import * as path from "path";
import { computeReadiumCssJsonMessage } from "readium-desktop/common/computeReadiumCssJsonMessage";
import { ReaderConfig } from "readium-desktop/common/models/reader";
import { diMainGet } from "readium-desktop/main/di";
import { _NODE_MODULE_RELATIVE_URL, _PACKAGING } from "readium-desktop/preprocessor-directives";

import { IEventPayload_R2_EVENT_READIUMCSS } from "@r2-navigator-js/electron/common/events";
import { setupReadiumCSS } from "@r2-navigator-js/electron/main/readium-css";
import { secureSessions } from "@r2-navigator-js/electron/main/sessions";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";
import { Link } from "@r2-shared-js/models/publication-link";
import { Transformers } from "@r2-shared-js/transform/transformer";
import { TransformerHTML } from "@r2-shared-js/transform/transformer-html";
import { Server } from "@r2-streamer-js/http/server";

const debug = debug_("readium-desktop:main#streamer");

// Create readium2 streamer
// This streamer is used to stream epub content to the renderer
export const streamer: Server = new Server({
    disableDecryption: false,
    disableOPDS: true,
    disableReaders: true,
    disableRemotePubUrl: true,
});

app.on("ready", () => {
    secureSessions(streamer); // HTTPS
});

let rcssPath = "ReadiumCSS";
if (_PACKAGING === "1") {
    rcssPath = path.normalize(path.join(__dirname, rcssPath));
} else {
    rcssPath = "r2-navigator-js/dist/ReadiumCSS";
    rcssPath = path.normalize(path.join(__dirname, _NODE_MODULE_RELATIVE_URL, rcssPath));
}

rcssPath = rcssPath.replace(/\\/g, "/");
debug("readium css path:", rcssPath);

function computeReadiumCssJsonMessageInStreamer(
    _r2Publication: R2Publication,
    _link: Link | undefined,
    sessionInfo: string | undefined,
): IEventPayload_R2_EVENT_READIUMCSS {

    const winId = Buffer.from(sessionInfo || "", "base64").toString("utf-8");
    debug("winId:", winId);

    let settings: ReaderConfig;
    if (winId) {

        const store = diMainGet("store");
        const state = store.getState();

        try {
            settings = state.win.session.reader[winId].reduxState.config;

            debug("PAGED: ", settings.paged, "colCount:", settings.colCount);

        } catch (err) {
            settings = state.reader.defaultConfig;

            debug("settings from default config");
            debug("ERROR", err);
        }
    } else {

        const store = diMainGet("store");
        settings = store.getState().reader.defaultConfig;
    }

    return computeReadiumCssJsonMessage(settings);
}

setupReadiumCSS(streamer, rcssPath, computeReadiumCssJsonMessageInStreamer);

let mathJaxPath = "MathJax";
if (_PACKAGING === "1") {
    mathJaxPath = path.normalize(path.join(__dirname, mathJaxPath));
} else {
    mathJaxPath = "mathjax";
    mathJaxPath = path.normalize(path.join(__dirname, _NODE_MODULE_RELATIVE_URL, mathJaxPath));
}
mathJaxPath = mathJaxPath.replace(/\\/g, "/");
debug("MathJax path:", mathJaxPath);
// https://expressjs.com/en/4x/api.html#express.static
const staticOptions = {
    dotfiles: "ignore",
    etag: true,
    fallthrough: false,
    immutable: true,
    index: false,
    maxAge: "1d",
    redirect: false,
    // extensions: ["css", "otf"],
    setHeaders: (res: express.Response, _path: string, _stat: any) => {
        //   res.set('x-timestamp', Date.now())
        streamer.setResponseCORS(res);
    },
};
const MATHJAX_URL_PATH = "math-jax";
streamer.expressUse("/" + MATHJAX_URL_PATH, express.static(mathJaxPath, staticOptions));
const transformer = (_publication: R2Publication, _link: Link, _url: string | undefined, str: string): string => {

    const cssElectronMouseDrag =
`
<style type="text/css">
*,
*::after,
*::before {
    -webkit-user-drag: none !important;
    -webkit-app-region: no-drag !important;
}
</style>
`;

    str = str.replace(/<\/head>/, `${cssElectronMouseDrag}</head>`);

    const store = diMainGet("store");
    // TODO
    // Same comment that above
    const settings = store.getState().reader.defaultConfig;

    if (settings.enableMathJax) {
        const url = `${streamer.serverUrl()}/${MATHJAX_URL_PATH}/es5/tex-mml-chtml.js`;
        const script = `
        <script type="text/javascript">
window.MathJax = {
    startup: {
        ready: () => {
            console.log('MathJax is loaded, but not yet initialized');
            window.MathJax.startup.defaultReady();
            console.log('MathJax is initialized, and the initial typeset is queued');
            window.MathJax.startup.promise.then(() => {
                console.log('MathJax initial typesetting complete');
            });
        }
    }
};
        </script>
        <script type="text/javascript" async="async" src="${url}"> </script>`;
        return str.replace(/<\/head>/, `${script}</head>`);
    } else {
        return str;
    }
};
Transformers.instance().add(new TransformerHTML(transformer));
