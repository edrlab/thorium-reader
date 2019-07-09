// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export function extractHostname(url: string, tld: boolean) {
    let hostname;

    // find & remove protocol (http, ftp, etc.) and get hostname
    if (url.indexOf("://") > -1) {
        hostname = url.split("/")[2];
    } else {
        hostname = url.split("/")[0];
    }

    // find & remove port number
    hostname = hostname.split(":")[0];

    // find & remove "?"
    hostname = hostname.split("?")[0];

    if (tld) {
      const hostnames = hostname.split(".");
      hostname = hostnames[hostnames.length - 2] + "." + hostnames[hostnames.length - 1];
    }

    return hostname;
}
