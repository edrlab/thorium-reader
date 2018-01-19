import * as path from "path";

import { initGlobals } from "r2-shared-js/dist/es6-es2015/src/init-globals";
import { Server } from "r2-streamer-js/dist/es6-es2015/src/http/server";
import { setLcpNativePluginPath } from "r2-lcp-js/dist/es6-es2015/src/parser/epub/lcp";
import { installLcpHandler } from "r2-navigator-js/dist/es6-es2015/src/electron/main/lcp";
import { setupReadiumCSS } from "r2-navigator-js/dist/es6-es2015/src/electron/main/readium-css";
import { deviceIDManager } from "r2-testapp-js/dist/es6-es2015/src/electron/main/lsd-deviceid-manager";

initGlobals();
const lcpNativePluginPath = path.normalize(path.join(__dirname, "external-assets", "lcp.node"));
setLcpNativePluginPath(lcpNativePluginPath);

// Create readium2 streamer
// This streamer is used to stream epub content to the renderer
export const streamer: Server = new Server({
    disableDecryption: false,
    disableReaders: true,
});

installLcpHandler(streamer, deviceIDManager);

setupReadiumCSS(streamer, path.join(__dirname, "node_modules", "r2-testapp-js", "dist", "ReadiumCSS"));
