// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");

// import { consoleRedirect } from "../common/console-redirect";
if (IS_DEV) {
    // tslint:disable-next-line:no-var-requires
    // eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-require-imports
    const cr = require("./common/console-redirect");
    // const releaseConsoleRedirect =
    cr.consoleRedirect("r2:navigator#electron/renderer/index", process.stdout, process.stderr, true);
}

export * from "./dom";
export * from "./readium-css";
export * from "./epubReadingSystem";
export * from "./location";
export * from "./readaloud";
export * from "./media-overlays";
export * from "./highlight";
