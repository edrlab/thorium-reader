// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";

import * as path from "path";

import { app } from "electron";

import { Server } from "@r2-streamer-js/http/server";

import { setupReadiumCSS } from "@r2-navigator-js/electron/main/readium-css";

import { secureSessions } from "@r2-navigator-js/electron/main/sessions";

import {
    _NODE_MODULE_RELATIVE_URL,
    _PACKAGING,
} from "readium-desktop/preprocessor-directives";

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

setupReadiumCSS(streamer, rcssPath, undefined);
