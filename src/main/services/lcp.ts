// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import * as fs from "fs";
import * as uuid from "uuid";

import { JSON as TAJSON } from "ta-json-x";

import { injectable} from "inversify";

import { Publication as Epub } from "@r2-shared-js/models/publication";
import { EpubParsePromise } from "@r2-shared-js/parser/epub";

import { LcpInfo } from "readium-desktop/common/models/lcp";

import { PublicationDocument } from "readium-desktop/main/db/document/publication";

import { injectDataInZip } from "readium-desktop/utils/zip";

import { PublicationStorage } from "readium-desktop/main/storage/publication-storage";

import { PublicationRepository } from "readium-desktop/main/db/repository/publication";

import { DeviceIdManager } from "./device";

// Logger
const debug = debug_("readium-desktop:main#services/lcp");

@injectable()
export class LcpManager {
    private deviceIdManager: DeviceIdManager;
    private publicationStorage: PublicationStorage;
    private publicationRepository: PublicationRepository;

    public constructor(
        publicationRepository: PublicationRepository,
        publicationStorage: PublicationStorage,
        deviceIdManager: DeviceIdManager,
    ) {
        this.publicationRepository = publicationRepository;
        this.publicationStorage = publicationStorage;
        this.deviceIdManager = deviceIdManager;
    }

    /**
     * Inject lcpl document in publication
     *
     * @param PublicationDocument Publication document on which we inject the lcpl
     * @param lcpl: Lcpl object
     */
    public async injectLcpl(
        publicationDocument: PublicationDocument,
        lcpl: any,
    ): Promise<PublicationDocument> {
        // Get epub file path
        const epubPath = this.publicationStorage.getPublicationEpubPath(
            publicationDocument.identifier,
        );
        // Inject lcpl in a temporary zip
        debug("Inject LCPL - START", epubPath);
        await injectDataInZip(
                epubPath,
                epubPath + ".lcp",
                JSON.stringify(lcpl),
                "META-INF/license.lcpl",
        );
        debug("Inject LCPL - END", epubPath);

        // Replace epub without LCP with a new one containing LCPL
        fs.unlinkSync(epubPath);
        fs.renameSync(epubPath + ".lcp", epubPath);

        debug("Parse publication - START", epubPath);
        const parsedPublication: Epub = await EpubParsePromise(epubPath);
        let lcpInfo: LcpInfo = null;

        if (parsedPublication.LCP) {
            // Add Lcp info
            lcpInfo = {
                provider: parsedPublication.LCP.Provider,
                issued: parsedPublication.LCP.Issued,
                updated: parsedPublication.LCP.Updated,
                rights: {
                    copy: parsedPublication.LCP.Rights.Copy,
                    print: parsedPublication.LCP.Rights.Print,
                    start: parsedPublication.LCP.Rights.Start,
                    end: parsedPublication.LCP.Rights.End,
                },
            };

            // Search for lsd status url
            for (const link of parsedPublication.LCP.Links) {
                if (link.Rel === "status") {
                    // This is the lsd status url link
                    lcpInfo.lsd = {
                        statusUrl: link.Href,
                    };
                    break;
                }
            }
        }
        debug("Parse publication - END", epubPath);

        // FIXME: Title could be an array instead of a simple string
        // Store publication in db
        const jsonParsedPublication = TAJSON.serialize(parsedPublication);
        const b64ParsedPublication = Buffer
            .from(JSON.stringify(jsonParsedPublication))
            .toString("base64");
        const newPublicationDocument = Object.assign(
            {},
            publicationDocument,
            {
                resources: {
                    filePublication: b64ParsedPublication,
                    opdsPublication: publicationDocument.resources.opdsPublication,
                },
                lcp: lcpInfo,
            },
        );
        return this.publicationRepository.save(newPublicationDocument);
    }
}
