// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import * as path from "path";
import { commandLineMainEntry } from "readium-desktop/main/cli";

import { setLcpNativePluginPath } from "@r2-lcp-js/parser/epub/lcp";
import { initGlobalConverters_OPDS } from "@r2-opds-js/opds/init-globals";
import {
    initGlobalConverters_GENERIC, initGlobalConverters_SHARED,
} from "@r2-shared-js/init-globals";

import { initSessions as initSessionsNoHTTP } from "./main/streamer/streamerNoHttp";
import { createStoreFromDi } from "./main/di";
import { appActions } from "./main/redux/actions";

// isURL() excludes the file: and data: URL protocols, as well as http://localhost but not http://127.0.0.1 or http(s)://IP:PORT more generally (note that ftp: is accepted)
// import isURL from "validator/lib/isURL";
// if (__TH__IS_DEV__) {
//     ["https://edrlab.org", "https://edrlab.org:443", "http://edrlab.org", "http://edrlab.org:80", "http://edrlab.org:8080", "ftp://edrlab.org", "ssh://edrlab.org", "data:,Hello%2C%20World%21", "data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==", "data:text/html,%3Ch1%3EHello%2C%20World%21%3C%2Fh1%3E", "data:text/html;charset=utf-8,<html>", "data:text/html,%3Cscript%3Ealert%28%27hi%27%29%3B%3C%2Fscript%3E", "http://127.0.0.1", "http://127.0.0.1:80", "http://127.0.0.1:8080", "http://localhost", "http://localhost:80", "http://localhost:8080", "http://192.168.100.1", "http://192.168.100.1:80", "http://89.66.100.1:8080", "http://89.66.100.1", "http://89.66.100.1:80", "http://89.66.100.1:8080", "file:///root/sub/file", "file://root/sub/file", "file:///root/sub%25file", "file://root/sub%25file", "filex://", "pdf-extract://", "thoriumhttps://", "r2https://", "opds-media://", "opds://", "thorium://"].forEach((u) => console.log(`isURL? ${u} ===> ${isURL(u)}`));
// }

// import { initSessions as initSessionsHTTP } from "@r2-navigator-js/electron/main/sessions";

// TO TEST ESM (not COMMONJS):
// // import * as normalizeUrl from_"normalize-url";
// import normalizeUrl from_"normalize-url";
// console.log(normalizeUrl("//www.sindresorhus.com:80/../baz?b=bar&a=foo"), "#".repeat(200));
// // import("normalize-url").then(({default: normalizeUrl}) => {
// //     //=> 'http://sindresorhus.com/baz?a=foo&b=bar'
// //     console.log("#".repeat(2000), normalizeUrl("//www.sindresorhus.com:80/../baz?b=bar&a=foo"));
// // });

if (__TH__IS_PACKAGED__) {
    // Disable debug in packaged app
    delete process.env.DEBUG;
    debug_.disable();

    /**
     * yargs used console and doesn't used process.stdout
     */
    /*
    console.log = (_message?: any, ..._optionalParams: any[]) => { return; };
    console.warn = (_message?: any, ..._optionalParams: any[]) => { return; };
    console.error = (_message?: IArrayWinRegistryReaderState,any, ..._optionalParams: any[]) => { return; };
    console.info = (_message?: any, ..._optionalParams: any[]) => { return; };
     */
}

// Logger
const debug = debug_("readium-desktop:main");

// Global
initGlobalConverters_OPDS();
initGlobalConverters_SHARED();
initGlobalConverters_GENERIC();

// Lcp
const lcpNativePluginPath = path.normalize(path.join(__dirname, "external-assets", "lcp.node"));
setLcpNativePluginPath(lcpNativePluginPath);

// so that "tmp" can cleanup on process exit?
// SIGTERM?
// in Electron: before-quit App event
// process.on("SIGINT", () => {
//     console.log("SIGINT ... process.exit()");
//     process.exit();
// });

// protocol.registerSchemesAsPrivileged should be called before app is ready at initSessions
// if (_USE_HTTP_STREAMER) {
//     initSessionsHTTP();
// } else {
//     initSessionsNoHTTP();
// }
initSessionsNoHTTP();

if (__TH__IS_VSCODE_LAUNCH__) {
    createStoreFromDi().then((store) => store.dispatch(appActions.initRequest.build()));
} else {
    commandLineMainEntry(); // call main fct
}

debug("Process version:", process.versions);
