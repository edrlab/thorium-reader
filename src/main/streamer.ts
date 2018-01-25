import * as path from "path";

import { initGlobals } from "@r2-shared-js/init-globals";
import { Server } from "@r2-streamer-js/http/server";
import { setLcpNativePluginPath } from "@r2-lcp-js/parser/epub/lcp";
import { installLcpHandler } from "@r2-navigator-js/electron/main/lcp";
import { setupReadiumCSS } from "@r2-navigator-js/electron/main/readium-css";
import { deviceIDManager } from "@r2-testapp-js/electron/main/lsd-deviceid-manager";

// Preprocessing directive
declare const __NODE_MODULE_RELATIVE_URL__: string;

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

setupReadiumCSS(streamer, path.normalize(path.join(
    __dirname, __NODE_MODULE_RELATIVE_URL__,
    "r2-navigator-js", "dist", "ReadiumCSS")));
