// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { dialog } from "electron";
import * as fs from "fs";
import { inject, injectable } from "inversify";
import * as path from "path";
import { RandomCustomCovers } from "readium-desktop/common/models/custom-cover";
import { Download } from "readium-desktop/common/models/download";
import { Publication } from "readium-desktop/common/models/publication";
import { closeReaderFromPublication } from "readium-desktop/common/redux/actions/reader";
import { convertMultiLangStringToString } from "readium-desktop/common/utils";
import { httpGet } from "readium-desktop/common/utils/http";
import { PublicationView } from "readium-desktop/common/views/publication";
import {
    PublicationDocument, THttpGetPublicationDocument,
} from "readium-desktop/main/db/document/publication";
import { PublicationRepository } from "readium-desktop/main/db/repository/publication";
import { diSymbolTable } from "readium-desktop/main/diSymbolTable";
import { OpdsParsingError } from "readium-desktop/main/exceptions/opds";
import { PublicationStorage } from "readium-desktop/main/storage/publication-storage";
import { JSON as TAJSON } from "ta-json-x";
import * as uuid from "uuid";
import * as xmldom from "xmldom";

import { convertOpds1ToOpds2_EntryToPublication } from "@r2-opds-js/opds/converter";
import { Entry } from "@r2-opds-js/opds/opds1/opds-entry";
import { OPDSPublication } from "@r2-opds-js/opds/opds2/opds2-publication";
import { Publication as Epub } from "@r2-shared-js/models/publication";
import { EpubParsePromise } from "@r2-shared-js/parser/epub";
import { XML } from "@r2-utils-js/_utils/xml-js-mapper";

import { diMainGet } from "../di";
import { Downloader } from "./downloader";
import { LcpManager } from "./lcp";

// Logger
const debug = debug_("readium-desktop:main#services/catalog");

@injectable()
export class CatalogService {
    @inject(diSymbolTable.downloader)
    private readonly downloader!: Downloader;

    @inject(diSymbolTable["lcp-manager"])
    private readonly lcpManager!: LcpManager;

    @inject(diSymbolTable["publication-storage"])
    private readonly publicationStorage!: PublicationStorage;

    @inject(diSymbolTable["publication-repository"])
    private readonly publicationRepository!: PublicationRepository;

    public async importFile(filePath: string, isLcpFile?: boolean): Promise<PublicationDocument> {
        const ext = path.extname(filePath);

        debug("Import File - START");
        if (ext === ".lcpl" || (ext === ".part" && isLcpFile)) {
            return this.importLcplFile(filePath);
        } else if (/\.epub[3]?$/.test(ext) || (ext === ".part" && !isLcpFile)) {
            return this.importEpubFile(filePath);
        }
        debug("Import File - END");

        return null;
    }

    public async importOpdsEntry(
        url: string,
        downloadSample: boolean,
        tags?: string[],
    ): Promise<THttpGetPublicationDocument> {
        debug("Import OPDS publication", url);
        return await httpGet(url, {}, async (opdsFeedData) => {
            let opdsPublication: OPDSPublication = null;

            if (opdsFeedData.isFailure) {
                return opdsFeedData;
            }
            if (opdsFeedData.body.startsWith("<?xml")) {
                // This is an opds feed in version 1
                // Convert to opds version 2
                const xmlDom = new xmldom.DOMParser().parseFromString(opdsFeedData.body);

                if (!xmlDom || !xmlDom.documentElement) {
                    throw new OpdsParsingError(`Unable to parse ${url}`);
                }

                const isEntry = xmlDom.documentElement.localName === "entry";

                if (!isEntry) {
                    throw new OpdsParsingError(`This is not an OPDS entry ${url}`);
                }
                const opds1Entry = XML.deserialize<Entry>(xmlDom, Entry);
                opdsPublication = convertOpds1ToOpds2_EntryToPublication(opds1Entry);
            } else {
                opdsPublication = TAJSON.deserialize<OPDSPublication>(
                    JSON.parse(opdsFeedData.body),
                    OPDSPublication,
                );
            }

            if (opdsPublication == null) {
                debug("Unable to retrieve opds publication", opdsPublication);
                throw new Error("Unable to retrieve opds publication");
            }
            try {
                opdsFeedData.data = await this.importOpdsPublication(opdsPublication, downloadSample, tags);
            } catch (error) {
                debug("Unable to retrieve opds publication", opdsPublication, error);
                throw new Error("Unable to retrieve opds publication: " + error);
            }
            return opdsFeedData;
        });
    }

    public async importOpdsPublication(
        opdsPublication: OPDSPublication,
        downloadSample: boolean,
        tags?: string[],
    ): Promise<PublicationDocument> {
        // Retrieve the download (acquisition) url
        let downloadUrl = null;
        let isLcpFile = false;

        for (const link of opdsPublication.Links) {
            if (downloadSample && link.TypeLink === "application/epub+zip"
                && link.Rel && link.Rel[0] === "http://opds-spec.org/acquisition/sample"
            ) {
                downloadUrl = link.Href;
            } else if (
                link.TypeLink === "application/epub+zip"
                && link.Rel && link.Rel[0] === "http://opds-spec.org/acquisition"
            ) {
                downloadUrl = link.Href;
                break;
            } else if (
                link.TypeLink === "application/vnd.readium.lcp.license-1.0+json"
                && link.Rel && link.Rel[0] === "http://opds-spec.org/acquisition"
            ) {
                downloadUrl = link.Href;
                isLcpFile = true;
                break;
            }
        }

        if (downloadUrl == null) {
            debug("Unable to get an acquisition url from opds publication", opdsPublication.Links);
            throw new Error("Unable to get acquisition url from opds publication");
        }

        // Download publication
        const download: Download = this.downloader.addDownload(downloadUrl);

        debug("[START] Download publication", downloadUrl);
        const newDownload = await this.downloader.processDownload(
            download.identifier,
            {
                onProgress: (dl: Download) => {
                    debug("[PROGRESS] Downloading publication", dl.progress);
                },
            },
        );
        debug("[END] Download publication", downloadUrl, newDownload);
        // Import downloaded publication in catalog
        let publicationDocument = await this.importFile(download.dstPath, isLcpFile);

        // Add opds publication serialization to resources
        const jsonOpdsPublication = TAJSON.serialize(opdsPublication);
        const b64OpdsPublication = Buffer
            .from(JSON.stringify(jsonOpdsPublication))
            .toString("base64");

        // Merge with the original publication
        publicationDocument = Object.assign(
            {},
            publicationDocument,
            {
                resources: {
                    filePublication: publicationDocument.resources.filePublication,
                    opdsPublication: b64OpdsPublication,
                },
                tags,
            },
        );

        return this.publicationRepository.save(publicationDocument);
    }

    public async deletePublication(publicationIdentifier: string) {
        const store = diMainGet("store");
        const publicationApi = diMainGet("publication-api");
        const publication = await publicationApi.get(publicationIdentifier);

        store.dispatch(closeReaderFromPublication(publication));

        // Remove from database
        await this.publicationRepository.delete(publicationIdentifier);

        // Remove from storage
        this.publicationStorage.removePublication(publicationIdentifier);
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

    public async exportPublication(publication: PublicationView) {
        // Get main window
        const winRegistry = diMainGet("win-registry");
        let mainWindow;
        for (const window of (Object.values(winRegistry.getWindows())) as any) {
            if (window.type === "library") {
                mainWindow = window;
            }
        }

        // Open a dialog to select a folder then copy the publication in it
        let destinationPath: string = dialog.showOpenDialog(mainWindow, {
            properties: ["openDirectory"],
        })[0];

        // If the selected path is a file then choose the directory containing this file
        destinationPath = path.dirname(destinationPath);
        this.publicationStorage.copyPublicationToPath(publication, destinationPath);
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
            title: convertMultiLangStringToString(parsedPublication.Metadata.Title),
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
