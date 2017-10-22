import * as express from "express";
import * as path from "path";

import { initGlobals } from "r2-streamer-js/dist/es6-es2015/src/init-globals";
import { Server } from "r2-streamer-js/dist/es6-es2015/src/http/server";
import { setLcpNativePluginPath } from "r2-streamer-js/dist/es6-es2015/src/parser/epub/lcp";

initGlobals();
setLcpNativePluginPath(path.join(process.cwd(), "LCP/lcp.node"));

// Create readium2 streamer
// This streamer is used to stream epub content to the renderer
export const streamer: Server = new Server({
    disableDecryption: false,
    disableReaders: true,
});

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
    // setHeaders: function (res, path, stat) {
    //   res.set('x-timestamp', Date.now())
    // }
};
streamer.expressUse("/readium-css",
    express.static("node_modules/r2-streamer-js/dist/ReadiumCSS",
        staticOptions));
