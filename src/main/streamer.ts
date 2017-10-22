import * as express from "express";
import * as path from "path";

import { initGlobals } from "r2-streamer-js/dist/es6-es2015/src/init-globals";
import { Server } from "r2-streamer-js/dist/es6-es2015/src/http/server";
import { setLcpNativePluginPath } from "r2-streamer-js/dist/es6-es2015/src/parser/epub/lcp";
import { installLcpHandler } from "r2-streamer-js/dist/es6-es2015/src/electron/main/lcp";
import { setupReadiumCSS } from "r2-streamer-js/dist/es6-es2015/src/electron/main/readium-css";

initGlobals();
setLcpNativePluginPath(path.join(process.cwd(), "LCP/lcp.node"));

// Create readium2 streamer
// This streamer is used to stream epub content to the renderer
export const streamer: Server = new Server({
    disableDecryption: false,
    disableReaders: true,
});

installLcpHandler(streamer);

setupReadiumCSS(streamer, "node_modules/r2-streamer-js/dist/ReadiumCSS");
