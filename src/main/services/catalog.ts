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
import * as moment from "moment";
import * as path from "path";
import { RandomCustomCovers } from "readium-desktop/common/models/custom-cover";
import { Download } from "readium-desktop/common/models/download";
import { ToastType } from "readium-desktop/common/models/toast";
import {
    downloadActions, readerActions, toastActions,
} from "readium-desktop/common/redux/actions/";
import { Translator } from "readium-desktop/common/services/translator";
import { convertMultiLangStringToString } from "readium-desktop/common/utils";
import { IOpdsLinkView } from "readium-desktop/common/views/opds";
import { PublicationView } from "readium-desktop/common/views/publication";
import {
    PublicationDocument, PublicationDocumentWithoutTimestampable,
} from "readium-desktop/main/db/document/publication";
import { LcpSecretRepository } from "readium-desktop/main/db/repository/lcp-secret";
import { PublicationRepository } from "readium-desktop/main/db/repository/publication";
import { diSymbolTable } from "readium-desktop/main/diSymbolTable";
import { PublicationStorage } from "readium-desktop/main/storage/publication-storage";
import { IS_DEV } from "readium-desktop/preprocessor-directives";
import { ContentType } from "readium-desktop/utils/content-type";
import { Store } from "redux";
import * as uuid from "uuid";

import { LCP } from "@r2-lcp-js/parser/epub/lcp";
import { TaJsonDeserialize, TaJsonSerialize } from "@r2-lcp-js/serializable";
import { OPDSPublication } from "@r2-opds-js/opds/opds2/opds2-publication";
import { EpubParsePromise } from "@r2-shared-js/parser/epub";

import { OpdsFeedViewConverter } from "../converter/opds";
import { extractCrc32OnZip } from "../crc";
import { RootState } from "../redux/states";
import { Downloader } from "./downloader";
import { LcpManager } from "./lcp";
import { WinRegistry } from "./win-registry";

// Logger
const debug = debug_("readium-desktop:main#services/catalog");

@injectable()
export class CatalogService {
    @inject(diSymbolTable["lcp-secret-repository"])
    private readonly lcpSecretRepository!: LcpSecretRepository;

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

    @inject(diSymbolTable["win-registry"])
    private readonly winRegistry!: WinRegistry;

    public async importEpubOrLcplFile(
        filePath: string,
        isLcpFile?: boolean,
        lcpHashedPassphrase?: string): Promise<PublicationDocument | undefined> {

        let publicationDocument: PublicationDocument | undefined;

        const ext = path.extname(filePath);
        const isLCPLicense = ext === ".lcpl" || (ext === ".part" && isLcpFile);
        try {
            const hash = isLCPLicense ? undefined : await extractCrc32OnZip(filePath);
            const publicationArray = hash ? await this.publicationRepository.findByHashId(hash) : undefined;
            if (publicationArray && publicationArray.length) {
                debug("importEpubOrLcplFile", publicationArray, hash);
                publicationDocument = publicationArray[0];
                this.store.dispatch(toastActions.openRequest.build(ToastType.Success,
                    this.translator.translate("message.import.alreadyImport", { title: publicationDocument.title })));
            } else {
                if (isLCPLicense) {
                    publicationDocument = await this.importLcplFile(filePath, lcpHashedPassphrase);
                } else if (/\.epub[3]?$/.test(ext) || (ext === ".part" && !isLcpFile)) {
                    publicationDocument = await this.importEpubFile(filePath, hash, lcpHashedPassphrase);
                }
                this.store.dispatch(toastActions.openRequest.build(ToastType.Success,
                    this.translator.translate("message.import.success", { title: publicationDocument.title })));
            }
        } catch (error) {
            debug("importEpubOrLcplFile (hash + import) fail with :" + filePath, error);
            this.store.dispatch(toastActions.openRequest.build(ToastType.Error,
                this.translator.translate("message.import.fail", { path: filePath })));
        }
        return publicationDocument;
    }

    public async importPublicationFromLink(
        link: IOpdsLinkView,
        r2OpdsPublicationBase64: string,
    ): Promise<PublicationDocument | undefined> {
        let returnPublicationDocument: PublicationDocument;

        if (!(link?.url && r2OpdsPublicationBase64)) {
            debug("Unable to get an acquisition url from opds publication", link);
            throw new Error("Unable to get acquisition url from opds publication");
        }

        const title = link.title || link.url;
        const isLcpFile = link.type === ContentType.Lcp;
        const isEpubFile = link.type === ContentType.Epub;
        if (!isLcpFile && !isEpubFile) {
            throw new Error(`OPDS download link is not EPUB! ${link.url} ${link.type}`);
        }

        // start the download service
        const download = this.downloader.addDownload(link.url);

        // this.store.dispatch(toastActions.openRequest.build(ToastType.Default,
        //     this.translator.translate("message.download.start", { title })));

        // send to the front-end the signal of download
        this.store.dispatch(downloadActions.request.build(download.srcUrl, title));

        const r2OpdsPublicationStr = Buffer.from(r2OpdsPublicationBase64, "base64").toString("utf-8");
        const r2OpdsPublicationJson = JSON.parse(r2OpdsPublicationStr);
        const r2OpdsPublication = TaJsonDeserialize<OPDSPublication>(r2OpdsPublicationJson, OPDSPublication);

        let lcpHashedPassphrase: string | undefined;
        const downloadLink = r2OpdsPublication.Links.find((l) => {
            return l.Href === link.url;
        });
        if (downloadLink) {
            const key = "lcp_hashed_passphrase";
            if (downloadLink.Properties &&
                downloadLink.Properties.AdditionalJSON &&
                downloadLink.Properties.AdditionalJSON[key]) {
                const lcpHashedPassphraseObj = downloadLink.Properties.AdditionalJSON[key];
                if (typeof lcpHashedPassphraseObj === "string") {
                    lcpHashedPassphrase = lcpHashedPassphraseObj as string;
                    // const lcpHashedPassphraseBuff = Buffer.from(lcpHashedPassphrase, "hex");
                }
            }
            // TODO: remove this in production!
            if (IS_DEV &&
                !lcpHashedPassphrase &&
                downloadLink && downloadLink.Href.indexOf("cantookstation.com/") > 0) {

                // mock for testing, as no server provides "lcp_hashed_passphrase" yet...
                lcpHashedPassphrase = "d62414a0ede9e20898a1cb0e26dd05c57d7ef7a396d195fac9b43c1447bfd9ac";
            }
        }

        // track download progress
        debug("[START] Download publication", link.url);
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

        // this.store.dispatch(toastActions.openRequest.build(ToastType.Success,
        //     this.translator.translate("message.download.success", { title })));

        debug("[END] Download publication", link.url, newDownload);

        this.store.dispatch(downloadActions.success.build(download.srcUrl));

        // Import downloaded publication in catalog
        let publicationDocument = await this.importEpubOrLcplFile(download.dstPath, isLcpFile, lcpHashedPassphrase);

        if (publicationDocument) {
            const tags = OpdsFeedViewConverter.getTagsFromOpdsPublication(r2OpdsPublication);

            // Merge with the original publication
            publicationDocument = Object.assign(
                {},
                publicationDocument,
                {
                    resources: {
                        r2PublicationBase64: publicationDocument.resources.r2PublicationBase64,
                        r2LCPBase64: publicationDocument.resources.r2LCPBase64,
                        r2LSDBase64: publicationDocument.resources.r2LSDBase64,
                        r2OpdsPublicationBase64,
                    },
                    tags,
                },
            );

            returnPublicationDocument = await this.publicationRepository.save(publicationDocument);
        }

        return returnPublicationDocument;
    }

    public async deletePublication(publicationIdentifier: string) {

        this.store.dispatch(readerActions.closeRequestFromPublication.build(publicationIdentifier));
        await new Promise((res, _rej) => {
            setTimeout(() => {
                res();
            }, 300); // allow extra completion time to ensure the filesystem ZIP streams are closed
        });

        // Remove from database
        await this.publicationRepository.delete(publicationIdentifier);

        // Remove from storage
        this.publicationStorage.removePublication(publicationIdentifier);
    }

    public async exportPublication(publicationView: PublicationView) {

        const libraryAppWindow = this.winRegistry.getLibraryWindow();

        // Open a dialog to select a folder then copy the publication in it
        const res = await dialog.showOpenDialog(
            libraryAppWindow ? libraryAppWindow.win : undefined,
            {
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

    private async importLcplFile(filePath: string, lcpHashedPassphrase?: string): Promise<PublicationDocument> {
        const jsonStr = fs.readFileSync(filePath, { encoding: "utf8" });
        const lcpJson = JSON.parse(jsonStr);
        const r2LCP = TaJsonDeserialize<LCP>(lcpJson, LCP);
        r2LCP.JsonSource = jsonStr;
        r2LCP.init();

        // LCP license checks to avoid unnecessary download:
        // CERTIFICATE_SIGNATURE_INVALID = 102
        // CERTIFICATE_REVOKED = 101
        // LICENSE_SIGNATURE_DATE_INVALID = 111
        // LICENSE_SIGNATURE_INVALID = 112
        // (USER_KEY_CHECK_INVALID = 141) is guaranteed because of dummy passphrase
        // (LICENSE_OUT_OF_DATE = 11) occurs afterwards, so will only be checked after passphrase try
        if (r2LCP.isNativeNodePlugin()) {
            if (r2LCP.Rights) {
                const now = moment.now();
                let res = 0;
                try {
                    if (r2LCP.Rights.Start) {
                        if (moment(r2LCP.Rights.Start).isAfter(now)) {
                            res = 11;
                        }
                    }
                    if (r2LCP.Rights.End) {
                        if (moment(r2LCP.Rights.End).isBefore(now)) {
                            res = 11;
                        }
                    }
                } catch (err) {
                    debug(err);
                }
                if (res) {
                    const msg = this.lcpManager.convertUnlockPublicationResultToString(res);
                    this.store.dispatch(toastActions.openRequest.build(ToastType.Error, msg));
                    throw new Error(`[${msg}] (${filePath})`);
                }
            }

            try {
                // await r2LCP.tryUserKeys([toSha256Hex("READIUM2-DESKTOP-THORIUM-DUMMY-PASSPHRASE")]);
                await r2LCP.dummyCreateContext();
            } catch (err) {
                if (err !== 141) { // USER_KEY_CHECK_INVALID
                    // CERTIFICATE_SIGNATURE_INVALID = 102
                    // CERTIFICATE_REVOKED = 101
                    // LICENSE_SIGNATURE_DATE_INVALID = 111
                    // LICENSE_SIGNATURE_INVALID = 112
                    const msg = this.lcpManager.convertUnlockPublicationResultToString(err);
                    this.store.dispatch(toastActions.openRequest.build(ToastType.Error, msg));
                    throw new Error(`[${msg}] (${filePath})`);
                }
            }
        }

        // search the path of the epub file
        let download: Download | undefined;

        let title: string | undefined;
        if (r2LCP.Links) {
            for (const link of r2LCP.Links) {
                if (link.Rel === "publication") {
                    download = this.downloader.addDownload(link.Href);
                    title = link.Title ?? download.srcUrl;
                }
            }
        }

        if (!download) {
            throw new Error(`Unable to initiate download of LCP pub: ${filePath}`);
        }

        // this.store.dispatch(toastActions.openRequest.build(ToastType.Default,
        //     this.translator.translate("message.download.start", { title })));

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

        // this.store.dispatch(toastActions.openRequest.build(ToastType.Success,
        //     this.translator.translate("message.download.success", { title })));

        debug("[END] Download publication", filePath, newDownload);

        this.store.dispatch(downloadActions.success.build(download.srcUrl));

        // inject LCP license into temporary downloaded file, so that we can check CRC
        // caveat: processStatusDocument() which is invoked later
        // can potentially update LCP license with latest from server,
        // so not a complete guarantee of match with an already-imported LCP EPUB.
        // Plus, such already-existing EPUB in the local bookshelf may or may not
        // include the latest injected LCP license! (as it only gets updated during user interaction
        // such as when opening the publication information dialog, and of course when reading the EPUB)
        await this.lcpManager.injectLcplIntoZip(download.dstPath, r2LCP);
        const hash = await extractCrc32OnZip(download.dstPath);
        const publicationArray = await this.publicationRepository.findByHashId(hash);
        if (publicationArray && publicationArray.length) {
            debug("importLcplFile", publicationArray, hash);
            const pubDocument = publicationArray[0];
            this.store.dispatch(toastActions.openRequest.build(ToastType.Success,
                this.translator.translate("message.import.alreadyImport", { title: pubDocument.title })));
            return pubDocument;
        }

        const publicationDocument = await this.importEpubFile(download.dstPath, undefined, lcpHashedPassphrase);
        return publicationDocument;
        // return this.lcpManager.injectLcpl(publicationDocument, r2LCP);
    }

    // hash = null so that extractCrc32OnZip() is not unnecessarily invoked
    // hash = undefined so invoke extractCrc32OnZip()
    private async importEpubFile(
        filePath: string,
        hash?: string,
        lcpHashedPassphrase?: string): Promise<PublicationDocument> {

        const r2Publication = await EpubParsePromise(filePath);
        // after EpubParsePromise, cleanup zip handler
        // (no need to fetch ZIP data beyond this point)
        r2Publication.freeDestroy();

        const r2PublicationJson = TaJsonSerialize(r2Publication);
        const r2PublicationStr = JSON.stringify(r2PublicationJson);
        const r2PublicationBase64 = Buffer.from(r2PublicationStr).toString("base64");

        const pubDocument: PublicationDocumentWithoutTimestampable = {
            identifier: uuid.v4(),
            resources: {
                r2PublicationBase64,
                r2LCPBase64: null, // updated below via lcpManager.updateDocumentLcpLsdBase64Resources()
                r2LSDBase64: null, // may be updated via lcpManager.processStatusDocument()
                r2OpdsPublicationBase64: null, // remains null as publication not originate from OPDS
            },
            title: convertMultiLangStringToString(r2Publication.Metadata.Title),
            tags: [],
            files: [],
            coverFile: null,
            customCover: null,
            hash: hash ? hash : (hash === null ? undefined : await extractCrc32OnZip(filePath)),

            lcp: null, // updated below via lcpManager.updateDocumentLcpLsdBase64Resources()
            lcpRightsCopies: 0,
        };
        this.lcpManager.updateDocumentLcpLsdBase64Resources(pubDocument, r2Publication.LCP);

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

                this.lcpManager.updateDocumentLcpLsdBase64Resources(pubDocument, r2Publication.LCP);
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

        if (lcpHashedPassphrase) {
            const lcpSecretDocs = await this.lcpSecretRepository.findByPublicationIdentifier(
                newPubDocument.identifier,
            );
            const secrets = lcpSecretDocs.map((doc) => doc.secret).filter((secret) => secret);

            if (!secrets || !secrets.includes(lcpHashedPassphrase)) {
                await this.lcpSecretRepository.save({
                    publicationIdentifier: newPubDocument.identifier,
                    secret: lcpHashedPassphrase,
                });
            }
        }

        debug("Publication imported", filePath);
        return newPubDocument;
    }
}
