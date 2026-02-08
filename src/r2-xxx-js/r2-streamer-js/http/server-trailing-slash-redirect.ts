// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import * as express from "express";

const debug = debug_("r2:streamer#http/server-trailing-slash-redirect");

// https://github.com/avinoamr/connect-slashes
export function trailingSlashRedirect(req: express.Request, res: express.Response, next: express.NextFunction) {

    const i = req.originalUrl.indexOf("?");

    let pathWithoutQuery = req.originalUrl;
    if (i >= 0) {
        pathWithoutQuery = pathWithoutQuery.substr(0, i);
    }
    if (pathWithoutQuery.substr(-1) === "/"
        || pathWithoutQuery.indexOf(".") >= 0) {
        return next();
    }

    let redirect = pathWithoutQuery + "/";
    if (i >= 0) {
        redirect += req.originalUrl.substr(i);
    }

    // Note that the HTTP 301 redirect does not contain CORS headers
    // server.setResponseCORS(res);

    debug(`REDIRECT: ${req.originalUrl} ==> ${redirect}`);
    res.redirect(301, redirect);
}
