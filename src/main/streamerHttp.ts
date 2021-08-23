// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// LINT
export const unused = true;

// import { app } from "electron";
// import * as express from "express";

// import { setupReadiumCSS } from "@r2-navigator-js/electron/main/readium-css";
// import { secureSessions } from "@r2-navigator-js/electron/main/sessions";

// import {
//     computeReadiumCssJsonMessageInStreamer, MATHJAX_FILE_PATH, MATHJAX_URL_PATH,
//     READIUMCSS_FILE_PATH, setupMathJaxTransformer,
// } from "./streamerCommon";

// import { Server } from "@r2-streamer-js/http/server";
// import { _USE_HTTP_STREAMER } from "readium-desktop/preprocessor-directives";

// const debug = debug_("readium-desktop:main#streamerHttp");

// export const streamer: Server = _USE_HTTP_STREAMER ? new Server({
//     disableDecryption: false,
//     disableOPDS: true,
//     disableReaders: true,
//     disableRemotePubUrl: true,
// }) : null;

// app.on("ready", () => {
//     if (_USE_HTTP_STREAMER) {
//         secureSessions(streamer); // HTTPS
//     }
// });

// if (_USE_HTTP_STREAMER) {
//     setupReadiumCSS(streamer, READIUMCSS_FILE_PATH, computeReadiumCssJsonMessageInStreamer);

//     // https://expressjs.com/en/4x/api.html#express.static
//     const staticOptions = {
//         dotfiles: "ignore",
//         etag: true,
//         fallthrough: false,
//         immutable: true,
//         index: false,
//         maxAge: "1d",
//         redirect: false,
//         // extensions: ["css", "otf"],
//         setHeaders: (res: express.Response, _path: string, _stat: any) => {
//             //   res.set('x-timestamp', Date.now())
//             streamer.setResponseCORS(res);
//         },
//     };
//     streamer.expressUse("/" + MATHJAX_URL_PATH, express.static(MATHJAX_FILE_PATH, staticOptions));

//     setupMathJaxTransformer(
//         () => `${streamer.serverUrl()}/${MATHJAX_URL_PATH}/es5/tex-mml-chtml.js`,
//     );
// }
