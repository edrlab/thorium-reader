// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export const R2_SESSION_WEBVIEW = "persist:readium2pubwebview";

import { encodeURIComponent_RFC3986 } from "@r2-utils-js/_utils/http/UrlUtils";

export const READIUM2_ELECTRON_HTTP_PROTOCOL = "httpsr2";

export const convertHttpUrlToCustomScheme = (url: string): string => {
    const matches = url.match(/(https?|thoriumhttps):\/\/([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)(?::([0-9]+))?\/pub\/([^\/]+)(\/.*)?/);
    if (matches && matches.length > 1) {
        const idMatch = matches[4];
        const decoded = decodeURIComponent(idMatch);
        const pubID =  decoded.replace(/([A-Z])/g, (match) => {
            // console.log(match);
            const ret = "_" + match.toLowerCase();
            // console.log(ret);
            return ret;
        }).replace(/=/g, "-").replace(/\//g, ".");
        const url_ = READIUM2_ELECTRON_HTTP_PROTOCOL + "://" +
            "id" + pubID +
            "/x" + matches[1] +
            "/ip" + matches[2] +
            "/p" + (matches[3] ? matches[3] : "") +
            matches[5];
        // console.log("convertHttpUrlToCustomScheme: ", url, " ===> ", url_);
        return url_;
    }
    return url;
};

export const convertCustomSchemeToHttpUrl = (url: string): string => {
    let url_ = url.replace(READIUM2_ELECTRON_HTTP_PROTOCOL + "://", "");
    // tslint:disable-next-line:max-line-length
    // const matches = url_.match(/(https?|thoriumhttps)\.ip([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)\.p([0-9]+)?\.id([^\/]+)(\/.*)?/);
    // tslint:disable-next-line:max-line-length
    const matches = url_.match(/id([^\/]+)\/x(https?|thoriumhttps)\/ip([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)\/p([0-9]+)?(\/.*)?/);
    if (matches && matches.length > 1) {
        const pubID = encodeURIComponent_RFC3986(
            matches[1].replace(/-/g, "=").replace(/\./g, "\/").replace(/(_[a-zA-Z])/g, (match) => {
            // console.log(match);
            const ret = match.substr(1).toUpperCase();
            // console.log(ret);
            return ret;
        }));
        url_ = matches[2] + "://" +
        matches[3] + (matches[4] ? (":" + matches[4]) : "") +
        "/pub/" + pubID +
        matches[5];
        // console.log("convertCustomSchemeToHttpUrl: ", url, " ===> ", url_);
        return url_;
    }
    return url;
};
