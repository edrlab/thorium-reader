// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import * as moment from "moment";

import { IDeviceIDManager } from "@r2-lcp-js/lsd/deviceid-manager";
import { lsdRenew_ } from "@r2-lcp-js/lsd/renew";
import { lsdReturn_ } from "@r2-lcp-js/lsd/return";
import { LSD } from "@r2-lcp-js/parser/epub/lsd";
import { Server } from "@r2-streamer-js/http/server";

const debug = debug_("r2:navigator#electron/main/lsd");

export async function doLsdReturn(
    publicationsServer: Server,
    deviceIDManager: IDeviceIDManager,
    publicationFilePath: string): Promise<LSD> {

    const publication = publicationsServer.cachedPublication(publicationFilePath);
    if (!publication || !publication.LCP || !publication.LCP.LSD) {
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        return Promise.reject("no publication LCP LSD data?!");
    }

    let returnResponseLsd: LSD;
    try {
        returnResponseLsd = await lsdReturn_(publication.LCP.LSD, deviceIDManager);
    } catch (err) {
        debug(err);
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        return Promise.reject(err);
    }
    if (returnResponseLsd) {
        publication.LCP.LSD = returnResponseLsd;
        return Promise.resolve(publication.LCP.LSD);
    }
    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
    return Promise.reject("doLsdReturn?!");
}

export async function doLsdRenew(
    publicationsServer: Server,
    deviceIDManager: IDeviceIDManager,
    publicationFilePath: string,
    endDateStr: string | undefined): Promise<LSD> {

    const publication = publicationsServer.cachedPublication(publicationFilePath);
    if (!publication || !publication.LCP || !publication.LCP.LSD) {
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        return Promise.reject("no publication LCP LSD data?!");
    }

    const endDate = endDateStr ? moment(endDateStr).toDate() : undefined;
    let returnResponseLsd: LSD;
    try {
        returnResponseLsd = await lsdRenew_(endDate, publication.LCP.LSD, deviceIDManager);
    } catch (err) {
        debug(err);
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        return Promise.reject(err);
    }
    if (returnResponseLsd) {
        publication.LCP.LSD = returnResponseLsd;
        return Promise.resolve(publication.LCP.LSD);
    }
    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
    return Promise.reject("doLsdRenew?!");
}
