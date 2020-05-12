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
import { acceptedExtensionObject, isAcceptedExtension } from "readium-desktop/common/extension";
import { RandomCustomCovers } from "readium-desktop/common/models/custom-cover";
import { Download } from "readium-desktop/common/models/download";
import { ToastType } from "readium-desktop/common/models/toast";
import {
    downloadActions, readerActions, toastActions,
} from "readium-desktop/common/redux/actions/";
import { Translator } from "readium-desktop/common/services/translator";
import { IOpdsLinkView } from "readium-desktop/common/views/opds";
import { PublicationView } from "readium-desktop/common/views/publication";
import { convertMultiLangStringToString } from "readium-desktop/main/converter/tools/localisation";
import {
    PublicationDocument, PublicationDocumentWithoutTimestampable,
} from "readium-desktop/main/db/document/publication";
import { LcpSecretRepository } from "readium-desktop/main/db/repository/lcp-secret";
import { PublicationRepository } from "readium-desktop/main/db/repository/publication";
import { diSymbolTable } from "readium-desktop/main/diSymbolTable";
import { PublicationStorage } from "readium-desktop/main/storage/publication-storage";
import { ContentType } from "readium-desktop/utils/content-type";
import { Store } from "redux";
import { v4 as uuidv4 } from "uuid";

import { LCP } from "@r2-lcp-js/parser/epub/lcp";
import { TaJsonDeserialize, TaJsonSerialize } from "@r2-lcp-js/serializable";
import { OPDSPublication } from "@r2-opds-js/opds/opds2/opds2-publication";
import { PublicationParsePromise } from "@r2-shared-js/parser/publication-parser";

import { PublicationViewConverter } from "../converter/publication";
import { getTagsFromOpdsPublication } from "../converter/tools/getTags";
import { extractCrc32OnZip } from "../crc";
import { getLibraryWindowFromDi } from "../di";
import { lpfToAudiobookConverter } from "../lpfConverter";
import { publicationActions } from "../redux/actions";
import { RootState } from "../redux/states";
import { Downloader } from "./downloader";
import { LcpManager } from "./lcp";

// import { WinRegistry } from "./win-registry";

// import { IS_DEV } from "readium-desktop/preprocessor-directives";

// Logger
const debug = debug_("readium-desktop:main#services/publication");

@injectable()
export class PublicationService {
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

    @inject(diSymbolTable["publication-view-converter"])
    private readonly publicationViewConverter!: PublicationViewConverter;

    // @inject(diSymbolTable["win-registry"])
    // private readonly winRegistry!: WinRegistry;

    public async importEpubOrLcplFile(
        filePath: string,
        _isLcpFile?: boolean,
        lcpHashedPassphrase?: string): Promise<PublicationDocument | undefined> {

        let publicationDocument: PublicationDocument | undefined;

        const ext = path.extname(filePath);
        const isLCPLicense = isAcceptedExtension("lcpLicence", ext); // || (ext === ".part" && isLcpFile);
        const isLPF = isAcceptedExtension("w3cAudiobook", ext);
        try {

            const hash = isLCPLicense ? undefined : await extractCrc32OnZip(filePath);
            const publicationArray = hash ? await this.publicationRepository.findByHashId(hash) : undefined;

            if (publicationArray?.length) {

                debug("importEpubOrLcplFile", publicationArray, hash);
                publicationDocument = publicationArray[0];
                this.store.dispatch(
                    toastActions.openRequest.build(
                        ToastType.Success,
                        this.translator.translate(
                            "message.import.alreadyImport", { title: publicationDocument.title },
                        ),
                    ),
                );
            } else {

                if (isLCPLicense) {
                    publicationDocument = await this.importLcplFile(filePath, lcpHashedPassphrase);

                } else  {
                    let epubFilePath = filePath;
                    let cleanFct: () => void;

                    if (isLPF) {
                        // convert .lpf to .audiobook
                        [epubFilePath, cleanFct] = await lpfToAudiobookConverter(filePath);
                    }

                    publicationDocument = await this.importEpubFile(epubFilePath, hash, lcpHashedPassphrase);

                    if (cleanFct) {
                        // not useful to wait promise-resolved here
                        cleanFct();
                    }
                }
                this.store.dispatch(
                    toastActions.openRequest.build(
                        ToastType.Success,
                        this.translator.translate(
                            "message.import.success", { title: publicationDocument.title },
                        ),
                    ),
                );
            }
        } catch (error) {

            debug("importEpubOrLcplFile (hash + import) fail with :" + filePath, error);
            this.store.dispatch(
                toastActions.openRequest.build(
                    ToastType.Error,
                    this.translator.translate(
                        "message.import.fail", { path: filePath },
                    ),
                ),
            );
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
        const isAudioBookPacked = link.type === ContentType.AudioBookPacked;
        const isAudioBookPackedLcp = link.type === ContentType.AudioBookPackedLcp;
        if (!isLcpFile && !isEpubFile && !isAudioBookPacked && !isAudioBookPackedLcp) {
            throw new Error(`OPDS download link is not EPUB or AudioBook! ${link.url} ${link.type}`);
        }

        const ext = isLcpFile ? acceptedExtensionObject.lcpLicence :
            (isEpubFile ? acceptedExtensionObject.epub :
            (isAudioBookPacked ? acceptedExtensionObject.audiobook :
                (isAudioBookPackedLcp ? acceptedExtensionObject.audiobookLcp : // not acceptedExtensionObject.audiobookLcpAlt
                    ""))); // downloader will try HTTP response headers
        // start the download service
        const download = this.downloader.addDownload(link.url, ext);

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
                    const lcpHashedPassphraseHexOrB64 = lcpHashedPassphraseObj as string;
                    let isHex = false;
                    try {
                        const low1 = lcpHashedPassphraseHexOrB64.toLowerCase();
                        const buff = Buffer.from(low1, "hex");
                        const str = buff.toString("hex");
                        const low2 = str.toLowerCase();
                        isHex = low1 === low2;
                        if (!isHex) {
                            debug(`OPDS lcp_hashed_passphrase should be HEX! (${lcpHashedPassphraseHexOrB64}) ${low1} !== ${low2}`);
                        } else {
                            debug(`OPDS lcp_hashed_passphrase is HEX: ${lcpHashedPassphraseHexOrB64}`);
                        }
                    } catch (err) {
                        debug(err); // ignore
                    }
                    if (isHex) {
                        lcpHashedPassphrase = lcpHashedPassphraseHexOrB64;
                    } else {
                        let isBase64 = false;
                        try {
                            const buff = Buffer.from(lcpHashedPassphraseHexOrB64, "base64");
                            const str = buff.toString("hex");
                            const b64 = Buffer.from(str, "hex").toString("base64");
                            isBase64 = lcpHashedPassphraseHexOrB64 === b64;
                            if (!isBase64) {
                                debug(`OPDS lcp_hashed_passphrase is not BASE64?! (${lcpHashedPassphraseHexOrB64}) ${lcpHashedPassphraseHexOrB64} !== ${b64}`);
                            } else {
                                debug(`OPDS lcp_hashed_passphrase is BASE64! (${lcpHashedPassphraseHexOrB64})`);
                            }
                        } catch (err) {
                            debug(err); // ignore
                        }
                        if (isBase64) {
                            lcpHashedPassphrase = Buffer.from(lcpHashedPassphraseHexOrB64, "base64").toString("hex");
                        }
                    }
                }
            }
            // NOTE: remove this in production!
            // if (// IS_DEV &&
            //     !lcpHashedPassphrase &&
            //     downloadLink && downloadLink.Href.indexOf("cantookstation.com/") > 0) {

            //     // mock for testing, as OPDS server does not provide "lcp_hashed_passphrase" yet...
            //     lcpHashedPassphrase = "d62414a0ede9e20898a1cb0e26dd05c57d7ef7a396d195fac9b43c1447bfd9ac";
            // }
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
            this.store.dispatch(
                toastActions.openRequest.build(
                    ToastType.Error,
                    this.translator.translate(
                        "message.download.error", { title, err: `[${err}]` },
                    ),
                ),
            );

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
            const tags = getTagsFromOpdsPublication(r2OpdsPublication);

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

    public async getPublication(identifier: string, checkLcpLsd: boolean = false): Promise<PublicationView> {

        let doc: PublicationDocument;
        try {
            doc = await this.publicationRepository.get(identifier);
        } catch (e) {
            debug(`can't get ${identifier}`, e);
            throw new Error(`publication not found`); // TODO translation
        }

        try {
            if (checkLcpLsd && doc.lcp) {
                doc = await this.lcpManager.checkPublicationLicenseUpdate(doc);
            }
        } catch (e) {
            debug(`error on checkPublicationLicenseUpdate`, e);
            throw new Error(`check lcp license in publication failed`); // TODO translation
        }

        try {
            return this.publicationViewConverter.convertDocumentToView(doc);
        } catch (e) {
            debug("error on convertDocumentToView", e);

            // tslint:disable-next-line: no-floating-promises
            // this.deletePublication(identifier);

            throw new Error(`${doc.title} is corrupted and should be removed`); // TODO translation
        }
    }

    public async deletePublication(identifier: string) {

        this.store.dispatch(readerActions.closeRequestFromPublication.build(identifier));

        // dispatch action to update publication/lastReadingQueue reducer
        this.store.dispatch(publicationActions.deletePublication.build(identifier));

        await new Promise((res, _rej) => {
            setTimeout(() => {
                res();
            }, 300); // allow extra completion time to ensure the filesystem ZIP streams are closed
        });

        // Remove from database
        await this.publicationRepository.delete(identifier);

        // Remove from storage
        this.publicationStorage.removePublication(identifier);
    }

    public async exportPublication(publicationView: PublicationView) {

        const libraryAppWindow = getLibraryWindowFromDi();

        // Open a dialog to select a folder then copy the publication in it
        const res = await dialog.showOpenDialog(
            libraryAppWindow ? libraryAppWindow : undefined,
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
                    this.store.dispatch(
                        toastActions.openRequest.build(
                            ToastType.Error, msg,
                        ),
                    );
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
                    this.store.dispatch(
                        toastActions.openRequest.build(
                            ToastType.Error, msg,
                        ),
                    );
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
                    const isEpubFile = link.Type === ContentType.Epub;
                    const isAudioBookPacked = link.Type === ContentType.AudioBookPacked;
                    const isAudioBookPackedLcp = link.Type === ContentType.AudioBookPackedLcp;
                    const ext = isEpubFile ? acceptedExtensionObject.epub :
                        (isAudioBookPacked ? acceptedExtensionObject.audiobook :
                            (isAudioBookPackedLcp ? acceptedExtensionObject.audiobookLcp : // not acceptedExtensionObject.audiobookLcpAlt
                                "")); // downloader will try HTTP response headers

                    download = this.downloader.addDownload(link.Href, ext);
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
        if (publicationArray?.length) {

            debug("importLcplFile", publicationArray, hash);
            const pubDocument = publicationArray[0];
            this.store.dispatch(
                toastActions.openRequest.build(
                    ToastType.Success,
                    this.translator.translate(
                        "message.import.alreadyImport", { title: pubDocument.title },
                    ),
                ),
            );
            return pubDocument;
        }

        const publicationDocument = await this.importEpubFile(download.dstPath, hash, lcpHashedPassphrase);
        return publicationDocument;
        // return this.lcpManager.injectLcpl(publicationDocument, r2LCP);
    }

    // hash = null so that extractCrc32OnZip() is not unnecessarily invoked
    // hash = undefined so invoke extractCrc32OnZip()
    private async importEpubFile(
        filePath: string,
        hash?: string,
        lcpHashedPassphrase?: string): Promise<PublicationDocument> {

        const r2Publication = await PublicationParsePromise(filePath);
        // after PublicationParsePromise, cleanup zip handler
        // (no need to fetch ZIP data beyond this point)
        r2Publication.freeDestroy();

        const r2PublicationJson = TaJsonSerialize(r2Publication);
        const r2PublicationStr = JSON.stringify(r2PublicationJson);
        const r2PublicationBase64 = Buffer.from(r2PublicationStr).toString("base64");

        const pubDocument: PublicationDocumentWithoutTimestampable = {
            identifier: uuidv4(),
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
            hash: hash ? hash : await extractCrc32OnZip(filePath),

            lcp: null, // updated below via lcpManager.updateDocumentLcpLsdBase64Resources()
            lcpRightsCopies: 0,
        };
        this.lcpManager.updateDocumentLcpLsdBase64Resources(pubDocument, r2Publication.LCP);

        debug(`publication document ID=${pubDocument.identifier} HASH=${pubDocument.hash}`);

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
