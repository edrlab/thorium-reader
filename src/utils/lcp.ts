// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as crypto from "crypto";
import * as debug_ from "debug";
import * as fs from "fs";
import * as path from "path";

import { Publication as Epub } from "@r2-shared-js/models/publication";
import { EpubParsePromise } from "@r2-shared-js/parser/epub";

import { IDeviceIDManager } from "@r2-lcp-js/lsd/deviceid-manager";

import { launchStatusDocumentProcessing } from "@r2-lcp-js/lsd/status-document-processing";

import { container } from "readium-desktop/main/di";

import { Publication } from "readium-desktop/common/models/publication";

import { PublicationStorage } from "readium-desktop/main/storage/publication-storage";

import { httpGet } from "readium-desktop/common/utils/http";
import { injectDataInZip } from "readium-desktop/utils/zip";

// Logger
const debug = debug_("readium-desktop:utils:lcp");

export function toSha256Hex(data: string) {
    const checkSum = crypto.createHash("sha256");
    checkSum.update(data);
    return checkSum.digest("hex");
}

export async function injectLcpl(publication: Publication, lcpl: string) {
    // FIXME: do not use services in utils
    // Get epub file from publication
    const pubStorage = container.get("publication-storage") as PublicationStorage;
    const epubPath = pubStorage.getPublicationEpubPath(publication.identifier);
    // Inject lcpl in a temporary zip
    await injectDataInZip(
            epubPath,
            epubPath + ".lcp",
            lcpl,
            "META-INF/license.lcpl",
    );

    // Replace epub without LCP with a new one containing LCPL
    fs.unlinkSync(epubPath);
    fs.renameSync(epubPath + ".lcp", epubPath);
}

export async function updateLicenseStatus(publication: Publication) {
    // Get lsd status
    const lsdResponse = await httpGet(
        publication.lcp.lsd.statusUrl,
        {timeout: 5000, json: true},
    ) as any;
    const lsdStatus = lsdResponse;

    // Force updating lcpl
    let lcplUrl: string = null;

    for (const link of lsdStatus.links) {
        if (link.rel === "license") {
            // This is the lsd status url link
            lcplUrl = link.href;
            break;
        }
    }

    if (!lcplUrl) {
        throw new Error("No lcpl file");
    }

    // Download lcpl
    const lcplResponse = await httpGet<string>(
        lcplUrl,
        {timeout: 5000},
    );

    // Inject lcpl in publication
    await injectLcpl(publication, lcplResponse);

    // Get epub file from publication
    // FIXME: do not use services in utils
    const pubStorage = container.get("publication-storage") as PublicationStorage;
    const epubPath = pubStorage.getPublicationEpubPath(publication.identifier);

    // Get lcpl information
    let parsedEpub: Epub = null;

    try {
        parsedEpub = await EpubParsePromise(epubPath);
    } catch (error) {
        debug(error);
    }

    // Update status document
    const deviceIdManager = container.get("device-id-manager") as IDeviceIDManager;
    const deviceId = await deviceIdManager.getDeviceID();

    try {
        /* await launchStatusDocumentProcessing(
                parsedEpub.LCP, deviceIdManager,
            async (licenseUpdateJson: string | undefined) => {
                debug("launchStatusDocumentProcessing DONE.");
                debug("new license", licenseUpdateJson);
                if (licenseUpdateJson) {
                    try {
                        await injectLcpl(publication, licenseUpdateJson);
                    } catch (err) {
                        console.log("1.5.error");
                        debug(err);
                    }
                }
            });*/
    } catch (err) {
        debug(err);
    }

}
