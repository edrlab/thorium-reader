// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import * as fs from "fs";
import * as path from "path";

import { JSON as TAJSON } from "ta-json-x";

import * as xmldom from "xmldom";

import * as uuid from "uuid";

import {
    convertOpds1ToOpds2_EntryToPublication,
} from "@r2-opds-js/opds/converter";

import { injectable} from "inversify";

import { RandomCustomCovers } from "readium-desktop/common/models/custom-cover";
import { Publication } from "readium-desktop/common/models/publication";

import { Publication as Epub } from "@r2-shared-js/models/publication";
import { EpubParsePromise } from "@r2-shared-js/parser/epub";

import { XML } from "@r2-utils-js/_utils/xml-js-mapper";

import { Entry } from "@r2-opds-js/opds/opds1/opds-entry";

import { PublicationDocument } from "readium-desktop/main/db/document/publication";
import { PublicationRepository } from "readium-desktop/main/db/repository/publication";

import { PublicationStorage } from "readium-desktop/main/storage/publication-storage";

import { Download } from "readium-desktop/common/models/download";

import { httpGet } from "readium-desktop/common/utils";
import { OpdsParsingError } from "readium-desktop/main/exceptions/opds";

import { Downloader } from "./downloader";
import { LcpManager } from "./lcp";

// Logger
const debug = debug_("readium-desktop:main#services/catalog");

@injectable()
export class CatalogService {
    private downloader: Downloader;
    private lcpManager: LcpManager;
    private publicationStorage: PublicationStorage;
    private publicationRepository: PublicationRepository;

    public constructor(
        publicationRepository: PublicationRepository,
        publicationStorage: PublicationStorage,
        downloader: Downloader,
        lcpManager: LcpManager,
    ) {
        this.publicationRepository = publicationRepository;
        this.publicationStorage = publicationStorage;
        this.downloader = downloader;
        this.lcpManager = lcpManager;
    }

    public async importFile(filePath: string): Promise<PublicationDocument> {
        const ext = path.extname(filePath);

        if (ext === ".epub") {
            return this.importEpubFile(filePath);
        } else if (ext === ".lcpl") {
            return this.importLcplFile(filePath);
        }

        return null;
    }

    public async importOpdsEntry(url: string): Promise<PublicationDocument> {
        console.log("####", url);
        const opdsFeedData = await httpGet(url) as string;

        if (opdsFeedData.startsWith("<?xml")) {
            // This is an opds feed in version 1
            // Convert to opds version 2
            const xmlDom = new xmldom.DOMParser().parseFromString(opdsFeedData);

            if (!xmlDom || !xmlDom.documentElement) {
                throw new OpdsParsingError(`Unable to parse ${url}`);
            }

            const isEntry = xmlDom.documentElement.localName === "entry";

            if (!isEntry) {
                throw new OpdsParsingError(`This is not an OPDS entry ${url}`);
            }
            const opds1Entry = XML.deserialize<Entry>(xmlDom, Entry);
            const opds2Publication = convertOpds1ToOpds2_EntryToPublication(opds1Entry);
            console.log("Import pub", opds2Publication);
        }

        return null;
    }

    public async deletePublication(publicationIdentifier: string) {
        // Remove from database
        await this.publicationRepository.delete(publicationIdentifier);

        // Remove from storage
        await this.publicationStorage.removePublication(publicationIdentifier);
    }

    /**
     * Refresh publication metadata
     *
     * @param publication Publication to refresh
     * @return: Refreshed publication
     */
    public async refreshPublicationMetadata(publication: Publication) {
        const pubPath = path.join(
            this.publicationStorage.getRootPath(),
            publication.files[0].url.substr(6),
        );

        const parsedPublication = await EpubParsePromise(pubPath);

        // Searialized parsed epub
        const jsonParsedPublication = TAJSON.serialize(parsedPublication);
        const b64ParsedPublication = Buffer
            .from(JSON.stringify(jsonParsedPublication))
            .toString("base-64");

        // Merge with the original publication
        const origPub = await this.publicationRepository.get(publication.identifier);
        const newPub = Object.assign(
            {},
            origPub,
            {
                resources: {
                    filePublication: b64ParsedPublication,
                },
            },
        );

        // Store refreshed metadata in db
        return await this.publicationRepository.save(newPub);
    }

    private async importLcplFile(filePath: string): Promise<PublicationDocument> {
        const buffer = fs.readFileSync(filePath);
        const lcpl = JSON.parse(buffer.toString());

        // search the path of the epub file
        let download: Download = null;

        if (lcpl.links) {
            for (const link of lcpl.links) {
                if (link.rel === "publication") {
                    download = this.downloader.addDownload(link.href);
                }
            }
        }

        if (download == null) {
            throw new Error("Unable to publication in lcpl file");
        }

        debug("[START] Download publication", filePath);
        const newDownload = await this.downloader.processDownload(
            download.identifier,
            {
                onProgress: (dl: Download) => {
                    debug("[PROGRESS] Downloading publication", dl.progress);
                },
            },
        );
        debug("[END] Download publication", filePath, newDownload);

        // Import downloaded publication
        const publicationDocument = await this.importEpubFile(download.dstPath);
        return this.lcpManager.injectLcpl(publicationDocument, lcpl);
    }

    private async importEpubFile(filePath: string): Promise<PublicationDocument> {
        debug("Parse publication - START", filePath);
        const parsedPublication: Epub = await EpubParsePromise(filePath);
        debug("Parse publication - END", filePath);

        // FIXME: Title could be an array instead of a simple string
        // Store publication in db
        const jsonParsedPublication = TAJSON.serialize(parsedPublication);
        const b64ParsedPublication = Buffer
            .from(JSON.stringify(jsonParsedPublication))
            .toString("base64");

        const pubDocument = {
            identifier: uuid.v4(),
            resources: {
                filePublication: b64ParsedPublication,
                opdsPublication: null,
            },
            title: parsedPublication.Metadata.Title,
            tags: [],
            files: [],
            coverFile: null,
            customCover: null,
        } as PublicationDocument;

        // Store publication on filesystem
        debug("[START] Store publication on filesystem", filePath);
        const files = await this.publicationStorage.storePublication(
            pubDocument.identifier, filePath,
        );
        debug("[END] Store publication on filesystem - END", filePath);

        // Add extracted files to document

        for (const file of files) {
            if (file.contentType.startsWith("image")) {
                pubDocument.coverFile = file;
            } else {
                pubDocument.files.push(file);
            }
        }

        if (pubDocument.coverFile === null) {
            debug("No cover found, generate custom one", filePath);
            // No cover file found
            // Generate a random custom cover
            pubDocument.customCover = RandomCustomCovers[
                Math.floor(Math.random() * RandomCustomCovers.length)
            ];
        }

        debug("[START] Store publication in database", filePath);
        const newPubDocument = await this.publicationRepository.save(pubDocument);
        debug("[END] Store publication in database", filePath);

        debug("Publication imported", filePath);
        return newPubDocument;
    }
}
