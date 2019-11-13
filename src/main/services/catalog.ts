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
import { LcpInfo } from "readium-desktop/common/models/lcp";
import { ToastType } from "readium-desktop/common/models/toast";
import {
    downloadActions, readerActions, toastActions,
} from "readium-desktop/common/redux/actions/";
import { Translator } from "readium-desktop/common/services/translator";
import { convertMultiLangStringToString, urlPathResolve } from "readium-desktop/common/utils";
import { httpGet } from "readium-desktop/common/utils/http";
import { PublicationView } from "readium-desktop/common/views/publication";
import {
    PublicationDocument, PublicationDocumentWithoutTimestampable, THttpGetPublicationDocument,
} from "readium-desktop/main/db/document/publication";
import { PublicationRepository } from "readium-desktop/main/db/repository/publication";
import { diSymbolTable } from "readium-desktop/main/diSymbolTable";
import { OpdsParsingError } from "readium-desktop/main/exceptions/opds";
import { PublicationStorage } from "readium-desktop/main/storage/publication-storage";
import { RootState } from "readium-desktop/renderer/redux/states";
import { Store } from "redux";
import { JSON as TAJSON } from "ta-json-x";
import * as uuid from "uuid";
import * as xmldom from "xmldom";

import { LCP } from "@r2-lcp-js/parser/epub/lcp";
import { convertOpds1ToOpds2_EntryToPublication } from "@r2-opds-js/opds/converter";
import { Entry } from "@r2-opds-js/opds/opds1/opds-entry";
import { OPDSPublication } from "@r2-opds-js/opds/opds2/opds2-publication";
import { EpubParsePromise } from "@r2-shared-js/parser/epub";
import { XML } from "@r2-utils-js/_utils/xml-js-mapper";

import { extractCrc32OnZip } from "../crc";
import { diMainGet } from "../di";
import { Downloader } from "./downloader";
import { LcpManager } from "./lcp";

// Logger
const debug = debug_("readium-desktop:main#services/catalog");

@injectable()
export class CatalogService {
    @inject(diSymbolTable.downloader)
    private readonly downloader!: Downloader;

    @inject(diSymbolTable["publication-storage"])
    private readonly publicationStorage!: PublicationStorage;

    @inject(diSymbolTable["publication-repository"])
    private readonly publicationRepository!: PublicationRepository;

    @inject(diSymbolTable.store)
    private readonly store!: Store<RootState>;

    @inject(diSymbolTable.translator)
    private readonly translator!: Translator;

    @inject(diSymbolTable["lcp-manager"])
    private readonly lcpManager!: LcpManager;

    public async importEpubOrLcplFile(filePath: string, isLcpFile?: boolean): Promise<PublicationDocument | undefined> {
        let publicationDocument: PublicationDocument | undefined;

        const ext = path.extname(filePath);
        const isLCPLicense = ext === ".lcpl" || (ext === ".part" && isLcpFile);
        try {
            const hash = isLCPLicense ? undefined : await extractCrc32OnZip(filePath);
            const publicationArray = hash ? await this.publicationRepository.findByHashId(hash) : undefined;
            if (publicationArray && publicationArray.length) {
                debug(publicationArray, hash);
                publicationDocument = publicationArray[0];
                this.store.dispatch(toastActions.openRequest.build(ToastType.Success,
                    this.translator.translate("message.import.alreadyImport", { title: publicationDocument.title })));
            } else {
                if (isLCPLicense) {
                    publicationDocument = await this.importLcplFile(filePath);
                } else if (/\.epub[3]?$/.test(ext) || (ext === ".part" && !isLcpFile)) {
                    publicationDocument = await this.importEpubFile(filePath, hash);
                }
                this.store.dispatch(toastActions.openRequest.build(ToastType.Success,
                    this.translator.translate("message.import.success", { title: publicationDocument.title })));
            }
        } catch (error) {
            debug("ImportFile (hash + import) fail with :" + filePath, error);
            this.store.dispatch(toastActions.openRequest.build(ToastType.Error,
                this.translator.translate("message.import.fail", { path: filePath })));
        }
        return publicationDocument;
    }

    // This function is called from importOpdsEntry() src/main/api/publication.ts
    // ... which generates:
    // store.dispatch(toastActions.openRequest)
    // store.dispatch(downloadActions.request|success|error)
    public async importPublicationFromOpdsUrl(
        url: string,
        downloadSample: boolean,
        tags?: string[],
    ): Promise<THttpGetPublicationDocument> {
        debug("Import OPDS publication", url);
        return await httpGet(url, {}, async (opdsFeedData) => {
            let r2OpdsPublication: OPDSPublication = null;

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
                r2OpdsPublication = convertOpds1ToOpds2_EntryToPublication(opds1Entry);

            } else {
                r2OpdsPublication = TAJSON.deserialize<OPDSPublication>(
                    JSON.parse(opdsFeedData.body),
                    OPDSPublication,
                );
            }

            if (r2OpdsPublication == null) {
                debug("Unable to retrieve opds publication", r2OpdsPublication);
                throw new Error("Unable to retrieve opds publication");
            }
            // resolve url in publication before extract them
            if (r2OpdsPublication.Links) {
                r2OpdsPublication.Links.forEach(
                    (ln, id, ar) => ln && ln.Href && (ar[id].Href = urlPathResolve(url, ln.Href)));
            }
            if (r2OpdsPublication.Images) {
                r2OpdsPublication.Images.forEach(
                    (ln, id, ar) => ln && ln.Href && (ar[id].Href = urlPathResolve(url, ln.Href)));
            }
            try {
                opdsFeedData.data = await this.importPublicationFromOpdsDoc(r2OpdsPublication, downloadSample, tags);
            } catch (error) {
                debug("Unable to retrieve opds publication", r2OpdsPublication, error);
                throw new Error("Unable to retrieve opds pub: " + error);
            }
            return opdsFeedData;
        });
    }

    // This function is called from importOpdsEntry() src/main/api/publication.ts
    // or from this importPublicationFromOpdsUrl()
    // ... which generate:
    // store.dispatch(toastActions.openRequest)
    // store.dispatch(downloadActions.request|success|error)
    // ... but note that this function also calls importEpubOrLcplFile()
    // which generate its own toast and download actions!
    public async importPublicationFromOpdsDoc(
        r2OpdsPublication: OPDSPublication,
        downloadSample: boolean,
        tags?: string[],
    ): Promise<PublicationDocument> {
        // Retrieve the download (acquisition) url
        let downloadUrl: string | undefined;
        let title: string | undefined;
        let isLcpFile = false;

        for (const link of r2OpdsPublication.Links) {
            if (downloadSample && link.TypeLink === "application/epub+zip"
                && link.Rel && link.Rel[0] === "http://opds-spec.org/acquisition/sample"
            ) {
                downloadUrl = link.Href;
                title = link.Title;
            } else if (
                link.TypeLink === "application/epub+zip"
                && link.Rel && link.Rel[0] === "http://opds-spec.org/acquisition"
            ) {
                downloadUrl = link.Href;
                title = link.Title;
                break;
            } else if (
                link.TypeLink === "application/vnd.readium.lcp.license-1.0+json"
                && link.Rel && link.Rel[0] === "http://opds-spec.org/acquisition"
            ) {
                downloadUrl = link.Href;
                title = link.Title;
                isLcpFile = true;
                break;
            }
        }

        if (!downloadUrl) {
            debug("Unable to get an acquisition url from opds publication", r2OpdsPublication.Links);
            throw new Error("Unable to get acquisition url from opds publication");
        }

        if (!title && r2OpdsPublication.Metadata && r2OpdsPublication.Metadata.Title) {
            title = convertMultiLangStringToString(r2OpdsPublication.Metadata.Title);
        }

        const download: Download = this.downloader.addDownload(downloadUrl);

        if (!title) {
            title = download.srcUrl;
        }

        this.store.dispatch(toastActions.openRequest.build(ToastType.Default,
            this.translator.translate("message.download.start", { title })));

        this.store.dispatch(downloadActions.request.build(download.srcUrl, title));

        debug("[START] Download publication", downloadUrl);
        let newDownload: Download;
        try {
            newDownload = await this.downloader.processDownload(
                download.identifier,
                {
                    onProgress: (dl: Download) => {
                        debug("[PROGRESS] Downloading publication", dl.progress);
                        this.store.dispatch(downloadActions.progress.build(download.srcUrl, dl.progress));
                    },
                },
            );
        } catch (err) {
            this.store.dispatch(toastActions.openRequest.build(ToastType.Error,
                this.translator.translate("message.download.error", { title, err: `[${err}]` })));

            this.store.dispatch(downloadActions.error.build(download.srcUrl));
            throw err;
        }

        this.store.dispatch(toastActions.openRequest.build(ToastType.Success,
            this.translator.translate("message.download.success", { title })));

        debug("[END] Download publication", downloadUrl, newDownload);

        // Import downloaded publication in catalog
        // FIXME: can be undefined type
        let publicationDocument = await this.importEpubOrLcplFile(download.dstPath, isLcpFile);

        // Add opds publication serialization to resources
        const r2OpdsPublicationJson = TAJSON.serialize(r2OpdsPublication);
        const r2OpdsPublicationStr = JSON.stringify(r2OpdsPublicationJson);
        const r2OpdsPublicationBase64 = Buffer.from(r2OpdsPublicationStr).toString("base64");

        // Merge with the original publication
        publicationDocument = Object.assign(
            {},
            publicationDocument,
            {
                resources: {
                    r2PublicationBase64: publicationDocument.resources.r2PublicationBase64,
                    r2OpdsPublicationBase64,
                },
                tags,
            },
        );
        return this.publicationRepository.save(publicationDocument);
    }

    public async deletePublication(publicationIdentifier: string) {

        this.store.dispatch(readerActions.closeRequestFromPublication.build(publicationIdentifier));

        // Remove from database
        await this.publicationRepository.delete(publicationIdentifier);

        // Remove from storage
        this.publicationStorage.removePublication(publicationIdentifier);
    }

    public async exportPublication(publicationView: PublicationView) {
        // Get main window
        const winRegistry = diMainGet("win-registry");
        let mainWindow;
        for (const window of (Object.values(winRegistry.getWindows())) as any) {
            if (window.type === "library") {
                mainWindow = window;
            }
        }

        // Open a dialog to select a folder then copy the publication in it
        const res = await dialog.showOpenDialog(mainWindow, {
            properties: ["openDirectory"],
        });
        if (!res.canceled) {
            if (res.filePaths && res.filePaths.length > 0) {
                let destinationPath = res.filePaths[0];
                // If the selected path is a file then choose the directory containing this file
                if (fs.statSync(destinationPath).isFile()) {
                    destinationPath = path.dirname(destinationPath);
                }
                this.publicationStorage.copyPublicationToPath(publicationView, destinationPath);
            }
        }
    }

    private async importLcplFile(filePath: string): Promise<PublicationDocument> {
        const jsonStr = fs.readFileSync(filePath, { encoding: "utf8" });
        const lcpJson = JSON.parse(jsonStr);
        const lcp = TAJSON.deserialize<LCP>(lcpJson, LCP);
        lcp.JsonSource = jsonStr;

        // search the path of the epub file
        let download: Download | undefined;

        let title: string | undefined;
        if (lcp.Links) {
            for (const link of lcp.Links) {
                if (link.Rel === "publication") {
                    title = link.Title;
                    download = this.downloader.addDownload(link.Href);
                }
            }
        }

        if (!download) {
            throw new Error(`Unable to initiate download of LCP pub: ${filePath}`);
        }

        if (!title) {
            title = download.srcUrl;
        }

        this.store.dispatch(toastActions.openRequest.build(ToastType.Default,
            this.translator.translate("message.download.start", { title })));

        this.store.dispatch(downloadActions.request.build(download.srcUrl, title));

        debug("[START] Download publication", filePath);
        let newDownload: Download;
        try {
            newDownload = await this.downloader.processDownload(
                download.identifier,
                {
                    onProgress: (dl: Download) => {
                        debug("[PROGRESS] Downloading publication", dl.progress);
                        this.store.dispatch(downloadActions.progress.build(download.srcUrl, dl.progress));
                    },
                },
            );
        } catch (err) {
            this.store.dispatch(toastActions.openRequest.build(ToastType.Error,
                this.translator.translate("message.download.error", { title, err: `[${err}]` })));

            this.store.dispatch(downloadActions.error.build(download.srcUrl));
            throw err;
        }

        this.store.dispatch(toastActions.openRequest.build(ToastType.Success,
            this.translator.translate("message.download.success", { title })));

        debug("[END] Download publication", filePath, newDownload);

        this.store.dispatch(downloadActions.success.build(download.srcUrl));

        // null so that extractCrc32OnZip() is not unnecessarily invoked
        const publicationDocument = await this.importEpubFile(download.dstPath, null);

        return this.lcpManager.injectLcpl(publicationDocument, lcp);
    }

    private async importEpubFile(filePath: string, hash?: string): Promise<PublicationDocument> {
        debug("Parse publication - START", filePath);
        const r2Publication = await EpubParsePromise(filePath);
        debug("Parse publication - END", filePath);

        let lcpInfo: LcpInfo = null;
        if (r2Publication.LCP) {
            lcpInfo = this.lcpManager.convertLcpLsdInfo(r2Publication.LCP);
        }
        debug(">> lcpInfo (importEpubFile):");
        debug(JSON.stringify(lcpInfo, null, 4));

        // FIXME: Title could be an array instead of a simple string
        // Store publication in db
        const r2PublicationJson = TAJSON.serialize(r2Publication);
        const r2PublicationStr = JSON.stringify(r2PublicationJson);
        const r2PublicationBase64 = Buffer.from(r2PublicationStr).toString("base64");

        const pubDocument: PublicationDocumentWithoutTimestampable = {
            identifier: uuid.v4(),
            resources: {
                r2PublicationBase64,
                r2OpdsPublicationBase64: null,
            },
            title: convertMultiLangStringToString(r2Publication.Metadata.Title),
            tags: [],
            files: [],
            coverFile: null,
            customCover: null,
            hash: hash ? hash : (hash === null ? undefined : await extractCrc32OnZip(filePath)),
            lcp: lcpInfo,

            // OPDSPublication? seems unused!
            // opdsPublication: undefined,
        };
        debug(pubDocument.hash);

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

        if (r2Publication.LCP) {
            try {
                await this.lcpManager.processStatusDocument(
                    pubDocument.identifier,
                    r2Publication,
                );

                debug(r2Publication.LCP);
                debug(r2Publication.LCP.LSD);

                lcpInfo = this.lcpManager.convertLcpLsdInfo(r2Publication.LCP);
                pubDocument.lcp = lcpInfo;

                debug(">> lcpInfo + LSD (importEpubFile):");
                debug(JSON.stringify(lcpInfo, null, 4));
            } catch (err) {
                debug(err);
            }

            if ((r2Publication as any).__LCP_LSD_UPDATE_COUNT) {
                debug("processStatusDocument LCP updated.");
                pubDocument.hash = await extractCrc32OnZip(filePath);
            }
        }

        debug("[START] Store publication in database", filePath);
        const newPubDocument = await this.publicationRepository.save(pubDocument);
        debug("[END] Store publication in database", filePath);

        debug("Publication imported", filePath);
        return newPubDocument;
    }
}
