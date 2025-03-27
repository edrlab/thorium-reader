// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import * as path from "path";
import { commandLineMainEntry } from "readium-desktop/main/cli";
import { _PACKAGING, _VSCODE_LAUNCH } from "readium-desktop/preprocessor-directives";

import { setLcpNativePluginPath } from "@r2-lcp-js/parser/epub/lcp";
import { initGlobalConverters_OPDS } from "@r2-opds-js/opds/init-globals";
import {
    initGlobalConverters_GENERIC, initGlobalConverters_SHARED,
} from "@r2-shared-js/init-globals";

import { initSessions as initSessionsNoHTTP } from "./main/streamer/streamerNoHttp";
import { createStoreFromDi } from "./main/di";
import { appActions } from "./main/redux/actions";

// import { initSessions as initSessionsHTTP } from "@r2-navigator-js/electron/main/sessions";

// TO TEST ESM (not COMMONJS):
// // import * as normalizeUrl from_"normalize-url";
// import normalizeUrl from_"normalize-url";
// console.log(normalizeUrl("//www.sindresorhus.com:80/../baz?b=bar&a=foo"), "#".repeat(200));
// // import("normalize-url").then(({default: normalizeUrl}) => {
// //     //=> 'http://sindresorhus.com/baz?a=foo&b=bar'
// //     console.log("#".repeat(2000), normalizeUrl("//www.sindresorhus.com:80/../baz?b=bar&a=foo"));
// // });

if (_PACKAGING !== "0") {
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

if (_VSCODE_LAUNCH === "true") {
    createStoreFromDi().then((store) => store.dispatch(appActions.initRequest.build()));
} else {
    commandLineMainEntry(); // call main fct
}

debug("Process version:", process.versions);
