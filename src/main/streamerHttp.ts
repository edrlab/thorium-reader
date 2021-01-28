// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { app } from "electron";
import * as express from "express";
import { _NODE_MODULE_RELATIVE_URL, _PACKAGING } from "readium-desktop/preprocessor-directives";

import { setupReadiumCSS } from "@r2-navigator-js/electron/main/readium-css";
import { secureSessions } from "@r2-navigator-js/electron/main/sessions";
import { Server } from "@r2-streamer-js/http/server";

import {
    computeReadiumCssJsonMessageInStreamer, MATHJAX_FILE_PATH, MATHJAX_URL_PATH,
    READIUMCSS_FILE_PATH, setupMathJaxTransformer,
} from "./streamerCommon";

// const debug = debug_("readium-desktop:main#streamerHttp");

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

setupReadiumCSS(streamer, READIUMCSS_FILE_PATH, computeReadiumCssJsonMessageInStreamer);

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
streamer.expressUse("/" + MATHJAX_URL_PATH, express.static(MATHJAX_FILE_PATH, staticOptions));

setupMathJaxTransformer(`${streamer.serverUrl()}/${MATHJAX_URL_PATH}/es5/tex-mml-chtml.js`);
