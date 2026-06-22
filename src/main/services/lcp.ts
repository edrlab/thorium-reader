// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { dialog } from "electron";
import { StatusEnum } from "@r2-lcp-js/parser/epub/lsd";
import debug_ from "debug";
import { shell } from "electron";
import * as fs from "fs";
import { inject, injectable } from "inversify";
import moment from "moment";
import * as path from "path";
import { pipeline } from "stream/promises";
import { acceptedExtensionObject } from "readium-desktop/common/extension";
import { lcpLicenseIsNotWellFormed } from "readium-desktop/common/lcp";
import { convertMultiLangStringToString } from "readium-desktop/common/language-string";
import { File } from "readium-desktop/common/models/file";
import { LcpInfo, LsdStatus } from "readium-desktop/common/models/lcp";
import { ToastType } from "readium-desktop/common/models/toast";
import { lcpActions, toastActions } from "readium-desktop/common/redux/actions/";
import { parseProblemDetails } from "readium-desktop/common/utils/http";
import { PublicationViewConverter } from "readium-desktop/main/converter/publication";
import {
    PublicationDocument, PublicationDocumentWithoutTimestampable,
} from "readium-desktop/main/db/document/publication";
import { PublicationRepository } from "readium-desktop/main/db/repository/publication";
import { diSymbolTable } from "readium-desktop/main/diSymbolTable";
import { decryptPersist, encryptPersist } from "readium-desktop/main/fs/persistCrypto";
import { createTempDir } from "readium-desktop/main/fs/path";
import { httpGet } from "readium-desktop/main/network/http";
import { RootState } from "readium-desktop/main/redux/states";
import { IPublicationFilesReplacement, PublicationStorage } from "readium-desktop/main/storage/publication-storage";
import { streamerCachedPublication } from "readium-desktop/main/streamer/streamerNoHttp";
import { ContentType, contentTypeisApiProblem, parseContentType } from "readium-desktop/utils/contentType";
import { rmrf } from "readium-desktop/utils/fs";
import { toSha256Hex } from "readium-desktop/utils/lcp";
import { findExtWithMimeType } from "readium-desktop/utils/mimeTypes";
import { tryCatch } from "readium-desktop/utils/tryCatch";
import { type Store } from "redux";
import isURL from "readium-desktop/common/utils/isURL";

import { LCP } from "@r2-lcp-js/parser/epub/lcp";
import { Link as LcpLink } from "@r2-lcp-js/parser/epub/lcp-link";
import { LSD } from "@r2-lcp-js/parser/epub/lsd";
import { TaJsonDeserialize, TaJsonSerialize } from "@r2-lcp-js/serializable";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";
import { PublicationParsePromise } from "@r2-shared-js/parser/publication-parser";

// import { injectBufferInZip } from "@r2-utils-js/_utils/zip/zipInjector";
import { injectBufferInZip } from "../tools/zipInjector";

import { diMainGet, lcpHashesFilePath } from "../di";
import { computeFileSha256, fileSha256MatchesExpectedHash, normalizeSha256HashForComparison } from "../tools/fileIntegrity";
import { buildPublicationFilesDocumentPatch } from "../tools/publicationDocument";
import { extractCrc32OnZip } from "../tools/crc";
import { LSDManager } from "./lsd";
import { getTranslator } from "readium-desktop/common/services/translator";
import { RequesetToCloseAllReadersWithTheSamePubId } from "../redux/sagas/reader";

// import { Server } from "@r2-streamer-js/http/server";

// import { JsonMap } from "readium-desktop/typings/json";

// Logger
const debug = debug_("readium-desktop:main#services/lcp");

const CONFIGREPOSITORY_LCP_SECRETS = "CONFIGREPOSITORY_LCP_SECRETS";

// object map with keys = PublicationDocument.identifier,
// and values = object tuple of single passphrase + provider (cached here to avoid costly lookup in Publication DB)
// this way, we can query all passphrases associated with a particular publication,
// or alternatively query all passphrases known for a given LCP provider
// (as in practice passphrases are sometimes shared between different publications from the same provider)
type TLCPSecrets = Record<string, { passphrase?: string, provider?: string }>;

interface ICheckPublicationLicenseUpdateResult {
    publicationDocument: PublicationDocument;
    r2Publication: R2Publication;
}

interface IProcessStatusDocumentResult {
    documentPatch?: Partial<PublicationDocumentWithoutTimestampable>;
    publicationFilesReplacement?: IPublicationFilesReplacement;
    r2Publication: R2Publication;
}

interface IPublicationArchiveUpdateResult {
    documentPatch: Partial<PublicationDocumentWithoutTimestampable>;
    publicationFilesReplacement: IPublicationFilesReplacement;
    r2Publication: R2Publication;
}

@injectable()
export class LcpManager {
    @inject(diSymbolTable["publication-view-converter"])
    private readonly publicationViewConverter!: PublicationViewConverter;

    @inject(diSymbolTable["publication-storage"])
    private readonly publicationStorage!: PublicationStorage;

    // @inject(diSymbolTable.streamer)
    // private readonly streamer!: Server;

    @inject(diSymbolTable["publication-repository"])
    private readonly publicationRepository!: PublicationRepository;

    @inject(diSymbolTable.store)
    private readonly store!: Store<RootState>;

    // @inject(diSymbolTable.translator)
    // private readonly translator!: Translator;

    @inject(diSymbolTable["lsd-manager"])
    private readonly lsdManager!: LSDManager;

    private translator = getTranslator();

    public async absorbDBToJson() {
        await this.getAllSecrets();
        debug("+++++ LCP secrets absorbDBToJson");
    }

    public async getAllSecrets(): Promise<TLCPSecrets> {
        debug("LCP getAllSecrets ...");

        const buff = await tryCatch(() => fs.promises.readFile(lcpHashesFilePath), "getAllSecrets fs.promises.readFile?");
        if (buff) {
            debug("LCP getAllSecrets from JSON", buff.length);

            const str = decryptPersist(buff, CONFIGREPOSITORY_LCP_SECRETS, lcpHashesFilePath);
            // if (!str) {
            //     throw new Error("decryptPersist???! CONFIGREPOSITORY_LCP_SECRETS");
            // }
            if (!str) {
                return {};
            }
            const json = JSON.parse(str);
            debug("LCP getAllSecrets: ", json);
            return json;
        }

        const json: TLCPSecrets = {};
        return json;
    }

    private async getSecrets(doc: PublicationDocument): Promise<string[]> {
        debug("LCP getSecrets ... ", doc.identifier);

        const secrets: string[] = [];

        const allSecrets = await this.getAllSecrets();
        const ids = Object.keys(allSecrets);
        for (const id of ids) {
            const val = allSecrets[id];
            if (val.passphrase && !secrets.includes(val.passphrase)) {
                const provider = doc.lcp?.provider;

                if (doc.identifier === id ||
                    provider && val.provider && provider === val.provider) {
                    secrets.push(val.passphrase);
                }
            }
        }

        debug("LCP getSecrets: ", secrets);
        return secrets;

        // const lcpSecretDocs = await this.lcpSecretRepository.findByPublicationIdentifier(
        //     doc.identifier,
        // );
        // const secrets = lcpSecretDocs.map((doc) => doc.secret).filter((secret) => secret);
        // return secrets;
    }

    public async saveSecret(doc: PublicationDocument, lcpHashedPassphrase: string) {
        debug("LCP saveSecret ... ", doc.identifier);

        // await this.lcpSecretRepository.save({
        //     publicationIdentifier: doc.identifier,
        //     secret: lcpHashedPassphrase,
        // });

        const allSecrets = await this.getAllSecrets();
        if (!allSecrets[doc.identifier]) {
            allSecrets[doc.identifier] = {};
        }
        allSecrets[doc.identifier].passphrase = lcpHashedPassphrase;
        if (doc.lcp?.provider) {
            allSecrets[doc.identifier].provider = doc.lcp.provider;
        }

        debug("LCP saveSecret: ", allSecrets);

        const str = JSON.stringify(allSecrets);
        const encrypted = encryptPersist(str, CONFIGREPOSITORY_LCP_SECRETS, lcpHashesFilePath);
        if (!encrypted) {
            throw new Error("encryptPersist???! CONFIGREPOSITORY_LCP_SECRETS");
        }
        await fs.promises.writeFile(lcpHashesFilePath, encrypted);
    }

    private async injectLcplIntoZip_(epubPath: string, lcpStr: string) {

        const extension = path.extname(epubPath);
        const isAudioBook = new RegExp(`\\${acceptedExtensionObject.audiobook}$`, "i").test(extension) ||
            new RegExp(`\\${acceptedExtensionObject.audiobookLcp}$`, "i").test(extension) ||
            new RegExp(`\\${acceptedExtensionObject.audiobookLcpAlt}$`, "i").test(extension);

        const isDivina = new RegExp(`\\${acceptedExtensionObject.divina}$`, "i").test(extension);

        const isLcpPdf = new RegExp(`\\${acceptedExtensionObject.pdfLcp}$`, "i").test(extension);

        const epubPathTMP = epubPath + ".tmplcpl";
        await new Promise<void>((resolve, reject) => {
            injectBufferInZip(
                epubPath,
                epubPathTMP,
                Buffer.from(lcpStr, "utf8"),
                ((!isAudioBook && !isDivina && !isLcpPdf) ? "META-INF/" : "") + "license.lcpl",
                (e: any) => {
                    debug("injectLcplIntoZip_ - injectBufferInZip ERROR!");
                    debug(e);
                    reject(e);
                },
                () => {
                    resolve();
                });
        });

        // Replace epub without LCP with a new one containing LCPL
        fs.unlinkSync(epubPath);
        await new Promise<void>((resolve, _reject) => {
            setTimeout(() => {
                resolve();
            }, 200); // to avoid issues with some filesystems (allow extra completion time)
        });
        fs.renameSync(epubPathTMP, epubPath);
        await new Promise<void>((resolve, _reject) => {
            setTimeout(() => {
                resolve();
            }, 200); // to avoid issues with some filesystems (allow extra completion time)
        });
    }

    public async injectLcplIntoZip(epubPath: string, lcp: LCP) {

        const jsonSource = lcp.JsonSource ? lcp.JsonSource : JSON.stringify(TaJsonSerialize(lcp));
        await this.injectLcplIntoZip_(epubPath, jsonSource);
    }

    private async finalizePublicationFilesReplacement(
        publicationFilesReplacement: IPublicationFilesReplacement | undefined,
    ): Promise<void> {

        if (!publicationFilesReplacement) {
            return;
        }

        try {
            await publicationFilesReplacement.finalize();
        } catch (e) {
            debug("finalizePublicationFilesReplacement failed", e);
        }
    }

    private async rollbackPublicationFilesReplacement(
        publicationFilesReplacement: IPublicationFilesReplacement | undefined,
    ): Promise<void> {

        if (!publicationFilesReplacement) {
            debug("rollbackPublicationFilesReplacement skipped, no staged publication files replacement");
            return;
        }

        try {
            debug("rollbackPublicationFilesReplacement start", {
                fileCount: publicationFilesReplacement.files.length,
            });
            await publicationFilesReplacement.rollback();
            debug("rollbackPublicationFilesReplacement done");
        } catch (e) {
            debug("rollbackPublicationFilesReplacement failed", e);
        }
    }

    // public async injectLcpl(
    //     publicationDocument: PublicationDocument,
    //     lcp: LCP,
    // ): Promise<PublicationDocument> {
    //     // Get epub file path
    //     const epubPath = this.publicationStorage.getPublicationEpubPath(
    //         publicationDocument.identifier,
    //     );

    //     await this.injectLcplIntoZip(epubPath, lcp);

    //     const r2Publication = await this.unmarshallR2Publication(publicationDocument); // , false
    //     r2Publication.LCP = lcp;

    //     try {
    //         await this.processStatusDocument(
    //             publicationDocument.identifier,
    //             r2Publication,
    //         );

    //         debug(r2Publication.LCP);
    //         debug(r2Publication.LCP.LSD);

    //     } catch (err) {
    //         debug(err);
    //     }

    //     if ((r2Publication as any).__LCP_LSD_UPDATE_COUNT) {
    //         debug("processStatusDocument LCP updated.");
    //     }

    //     const newPublicationDocument: PublicationDocumentWithoutTimestampable = {
    //         ...publicationDocument,
    //         hash: await extractCrc32OnZip(epubPath),
    //     };
    //     this.updateDocumentLcp(newPublicationDocument, r2Publication.LCP);

    //     return this.publicationRepository.save(newPublicationDocument);
    // }

    // MUTATES publicationDocument
    public async updateDocumentLcp(
        publicationDocument: PublicationDocumentWithoutTimestampable,
        r2LCP: LCP,
        skipFilesystemCache = false,
    ) {
        // if (!publicationDocument.resources) {
        //     publicationDocument.resources = {};
        // }
        if (r2LCP) {
            debug("updateDocumentLcp() with LCP");
            debug(r2LCP);

            // Legacy Base64 data blobs
            // const r2LCPStr = r2LCP.JsonSource ?? JSON.stringify(TaJsonSerialize(r2LCP));
            // publicationDocument.resources.r2LCPBase64 = Buffer.from(r2LCPStr).toString("base64");
            // const r2LCPJson = r2LCP.JsonSource ? JSON.parse(r2LCP.JsonSource) : TaJsonSerialize(r2LCP);
            // publicationDocument.resources.r2LCPJson = r2LCPJson;
            if (!skipFilesystemCache) {
                debug("updateDocumentLcp() !skipFilesystemCache");
                await this.publicationViewConverter.updateLcpCache(publicationDocument, r2LCP);
            }

            // if (r2LCP.LSD) {
            //     // Legacy Base64 data blobs
            //     // const r2LSDStr = JSON.stringify(r2LSDJson);
            //     // publicationDocument.resources.r2LSDBase64 = Buffer.from(r2LSDStr).toString("base64");
            //     const r2LSDJson = TaJsonSerialize(r2LCP.LSD);
            //     publicationDocument.resources.r2LSDJson = r2LSDJson;
            // }

            publicationDocument.lcp = this.convertLcpLsdInfo(
                r2LCP,
                // Legacy Base64 data blobs
                // publicationDocument.resources.r2LCPBase64,
                // publicationDocument.resources.r2LSDBase64
                // publicationDocument.resources.r2LCPJson,
                // publicationDocument.resources.r2LSDJson,
            );
        } else {
            debug("updateDocumentLcp() no LCP");
        }
    }

    // public async unmarshallR2Publication(
    //     publicationDocument: PublicationDocument,
    //     // requiresLCP: boolean,
    // ): Promise<R2Publication> {

    //     // let r2Publication: R2Publication;
    //     // Legacy Base64 data blobs
    //     // const mustParse = !publicationDocument.resources ||
    //     //     !publicationDocument.resources.r2PublicationBase64 ||
    //     //     (requiresLCP && !publicationDocument.resources.r2LCPBase64);
    //     // const mustParse = !publicationDocument.resources ||
    //     //     !publicationDocument.resources.r2PublicationJson ||
    //     //     (
    //     //         requiresLCP
    //     //         // && !publicationDocument.resources.r2LCPJson
    //     //     );

    //     // if (mustParse) {

    //     const epubPath = this.publicationStorage.getPublicationEpubPath(
    //         publicationDocument.identifier,
    //     );

    //     const r2Publication = await PublicationParsePromise(epubPath);
    //     // just like when calling lsdLcpUpdateInject():
    //     // r2Publication.LCP.ZipPath is set to META-INF/license.lcpl
    //     // r2Publication.LCP.init(); is called to prepare for decryption (native NodeJS plugin)
    //     // r2Publication.LCP.JsonSource is set

    //     // after PublicationParsePromise, cleanup zip handler
    //     // (no need to fetch ZIP data beyond this point)
    //     r2Publication.freeDestroy();

    //     // } else {
    //     //     // Legacy Base64 data blobs
    //     //     // const r2PublicationBase64 = publicationDocument.resources.r2PublicationBase64;
    //     //     // const r2PublicationStr = Buffer.from(r2PublicationBase64, "base64").toString("utf-8");
    //     //     // const r2PublicationJson = JSON.parse(r2PublicationStr);
    //     //     r2Publication = TaJsonDeserialize(publicationDocument.resources.r2PublicationJson, R2Publication);
    //     // }
    //     // if (!r2Publication.LCP &&
    //     //     publicationDocument.resources &&
    //     //     publicationDocument.resources.r2LCPJson) {

    //     //     // Legacy Base64 data blobs
    //     //     // const r2LCPBase64 = publicationDocument.resources.r2LCPBase64;
    //     //     // const r2LCPStr = Buffer.from(r2LCPBase64, "base64").toString("utf-8");
    //     //     // const r2LCPJson = JSON.parse(r2LCPStr);
    //     //     const r2LCPJson = publicationDocument.resources.r2LCPJson;

    //     //     if (lcpLicenseIsNotWellFormed(r2LCPJson)) {
    //     //         throw new Error(`LCP license malformed: ${JSON.stringify(r2LCPJson)}`);
    //     //     }

    //     //     const r2LCP = TaJsonDeserialize(r2LCPJson, LCP);

    //     //     const r2LCPStr = JSON.stringify(r2LCPJson);
    //     //     r2LCP.JsonSource = r2LCPStr;

    //     //     r2Publication.LCP = r2LCP;
    //     // }
    //     // if (r2Publication.LCP &&
    //     //     publicationDocument.resources &&
    //     //     publicationDocument.resources.r2LSDJson) {

    //     //     // Legacy Base64 data blobs
    //     //     // const r2LSDBase64 = publicationDocument.resources.r2LSDBase64;
    //     //     // const r2LSDStr = Buffer.from(r2LSDBase64, "base64").toString("utf-8");
    //     //     // const r2LSDJson = JSON.parse(r2LSDStr);
    //     //     const r2LSDJson = publicationDocument.resources.r2LSDJson;
    //     //     const r2LSD = TaJsonDeserialize(r2LSDJson, LSD);

    //     //     r2Publication.LCP.LSD = r2LSD;
    //     // }

    //     return r2Publication;
    // }

    // Leaves the passed publicationDocument unchanged. Saves and returns an
    // updated document object, unless another LCP update is locked.
    public async checkPublicationLicenseUpdate(
        publicationDocument: PublicationDocument,
        skipNetworkLSD: boolean,
    ): Promise<PublicationDocument> {
        const rootState = this.store.getState();
        if (rootState.lcp.publicationFileLocks[publicationDocument.identifier]) {
            // skip LSD processStatusDocument()
            return Promise.resolve(publicationDocument);
            // return Promise.reject(`Publication file lock busy ${publicationDocument.identifier}`);
        }
        this.store.dispatch(lcpActions.publicationFileLock.build({ [publicationDocument.identifier]: true }));
        try {
            const r2Publication = await this.publicationViewConverter.unmarshallR2Publication(publicationDocument); // , true

            const { publicationDocument: newPubDocument } =
                // Keep publicationDocument as the pre-refresh snapshot.
                await this.checkPublicationLicenseUpdate_(publicationDocument, r2Publication, skipNetworkLSD);
            return newPubDocument;
        } finally {
            this.store.dispatch(lcpActions.publicationFileLock.build({ [publicationDocument.identifier]: false }));
        }
    }

    // Builds a new publication document object before applying LCP/cache-derived
    // changes. The source publicationDocument remains the pre-refresh snapshot.
    // Side effects can include LCPL/cache/file updates and saving the copy.
    private async checkPublicationLicenseUpdate_(
        publicationDocument: PublicationDocument,
        r2Publication_: R2Publication,
        skipNetworkLSD: boolean,
    ): Promise<ICheckPublicationLicenseUpdateResult> {

        let r2Publication = r2Publication_;
        let redoHash = false;
        let documentPatch: Partial<PublicationDocumentWithoutTimestampable> | undefined;
        let publicationFilesReplacement: IPublicationFilesReplacement | undefined;
        if (!skipNetworkLSD && r2Publication.LCP) {
            try {
                const result = await this.processStatusDocument(
                    publicationDocument,
                    r2Publication,
                );
                r2Publication = result.r2Publication;
                documentPatch = result.documentPatch;
                publicationFilesReplacement = result.publicationFilesReplacement;

                debug(r2Publication.LCP);
                debug(r2Publication.LCP.LSD);

            } catch (err) {
                debug(err);
            }

            if ((r2Publication as any).__LCP_LSD_UPDATE_COUNT) {
                debug("processStatusDocument LCP updated.");
                redoHash = true;
            }
        }

        const epubPath = await this.publicationStorage.getPublicationEpubPath(
            publicationDocument.identifier,
        );

        const newPublicationDocument: PublicationDocumentWithoutTimestampable = {
            ...publicationDocument,
            ...(documentPatch || {}),
            hash: redoHash ? await extractCrc32OnZip(epubPath) : publicationDocument.hash,
        };

        // updateDocumentLcp writes LCP info onto this freshly-created document object.
        try {
            await this.updateDocumentLcp(newPublicationDocument, r2Publication.LCP);

            const newPubDocument = await this.publicationRepository.save(newPublicationDocument);
            await this.finalizePublicationFilesReplacement(publicationFilesReplacement);
            return Promise.resolve({
                publicationDocument: newPubDocument,
                r2Publication,
            });
        } catch (err) {
            await this.rollbackPublicationFilesReplacement(publicationFilesReplacement);
            throw err;
        }
    }

    public async renewPublicationLicense(
        publicationDocument: PublicationDocument,
    ): Promise<PublicationDocument> {

        const rootState = this.store.getState();
        if (rootState.lcp.publicationFileLocks[publicationDocument.identifier]) {
            return Promise.reject(`Publication file lock busy ${publicationDocument.identifier}`);
        }
        this.store.dispatch(lcpActions.publicationFileLock.build({ [publicationDocument.identifier]: true }));
        try {
            let r2Publication = await this.publicationViewConverter.unmarshallR2Publication(publicationDocument); // , true

            // Refresh first and continue with the returned saved document.
            const checked = await this.checkPublicationLicenseUpdate_(publicationDocument, r2Publication, false);
            let newPubDocument = checked.publicationDocument;
            r2Publication = checked.r2Publication;

            let redoHash = false;
            if (r2Publication.LCP?.LSD?.Links) {
                const renewLink = r2Publication.LCP.LSD.Links.find((l) => {
                    return l.HasRel("renew");
                });
                if (!renewLink) {
                    debug("!renewLink");
                    this.store.dispatch(toastActions.openRequest.build(ToastType.Error,
                        `LCP [${this.translator.translate("publication.renewButton")}] 👎`,
                    ));
                    return newPubDocument;
                }
                if (renewLink.Type !== ContentType.Lsd) {
                    if (renewLink.Type === ContentType.Html) {
                        if (renewLink.Href && /^https?:\/\//.test(renewLink.Href)) { // ignores file: mailto: data: thoriumhttps: httpsr2: thorium: opds: etc.
                            await shell.openExternal(renewLink.Href);
                        }
                        return newPubDocument;
                    }
                    debug(`renewLink.Type: ${renewLink.Type}`);
                    this.store.dispatch(toastActions.openRequest.build(ToastType.Error,
                        `LCP [${this.translator.translate("publication.renewButton")}] 👎`,
                    ));
                    return newPubDocument;
                }

                // const nowMs = new Date().getTime();
                // const numberOfDays = 2;
                // const laterMs = nowMs + (numberOfDays * 24 * 60 * 60 * 1000);
                // const later = new Date(laterMs);
                // const endDateStr = later.toISOString();
                // debug(`======== RENEW DATE 1: ${endDateStr}`);
                const endDateStr: string | undefined = undefined; // TODO: user input?
                const endDate = endDateStr ? moment(endDateStr).toDate() : undefined;
                let renewResponseLsd: LSD;
                try {
                    renewResponseLsd =
                        await this.lsdManager.lsdRenew(endDate, r2Publication.LCP.LSD);
                } catch (err) {
                    debug(err);

                    this.store.dispatch(toastActions.openRequest.build(ToastType.Error,
                        `LCP [${this.translator.translate("publication.renewButton")}]: ${err}`,
                        ));
                }
                if (renewResponseLsd) {
                    debug(renewResponseLsd);
                    r2Publication.LCP.LSD = renewResponseLsd;

                    redoHash = false;
                    let documentPatch: Partial<PublicationDocumentWithoutTimestampable> | undefined;
                    let publicationFilesReplacement: IPublicationFilesReplacement | undefined;
                    try {
                        const result = await this.processStatusDocument(
                            newPubDocument,
                            r2Publication,
                        );
                        r2Publication = result.r2Publication;
                        documentPatch = result.documentPatch;
                        publicationFilesReplacement = result.publicationFilesReplacement;

                        debug(r2Publication.LCP);
                        debug(r2Publication.LCP.LSD);

                    } catch (err) {
                        debug("Error processStatusDocument", err);
                    }

                    if ((r2Publication as any).__LCP_LSD_UPDATE_COUNT) {
                        debug("processStatusDocument LCP updated.");
                        redoHash = true;
                    }

                    const newEndDate = r2Publication.LCP && r2Publication.LCP.Rights && r2Publication.LCP.Rights.End ?
                        r2Publication.LCP.Rights.End.toISOString() : "";
                    this.store.dispatch(toastActions.openRequest.build(ToastType.Success,
                        `LCP [${this.translator.translate("publication.renewButton")}] ${newEndDate}`,
                        ));

                    const epubPath = await this.publicationStorage.getPublicationEpubPath(
                        publicationDocument.identifier,
                    );
                    const newPublicationDocument: PublicationDocumentWithoutTimestampable = {
                        ...newPubDocument,
                        ...(documentPatch || {}),
                        hash: redoHash ? await extractCrc32OnZip(epubPath) : newPubDocument.hash,
                    };

                    // updateDocumentLcp writes LCP info onto this freshly-created document object.
                    try {
                        await this.updateDocumentLcp(newPublicationDocument, r2Publication.LCP);

                        newPubDocument = await this.publicationRepository.save(newPublicationDocument);
                        await this.finalizePublicationFilesReplacement(publicationFilesReplacement);
                    } catch (err) {
                        await this.rollbackPublicationFilesReplacement(publicationFilesReplacement);
                        throw err;
                    }
                } else {
                    this.store.dispatch(toastActions.openRequest.build(ToastType.Error,
                        `LCP [${this.translator.translate("publication.renewButton")}] 👎`,
                    ));
                }
            }

            return Promise.resolve(newPubDocument);
        } finally {
            this.store.dispatch(lcpActions.publicationFileLock.build({ [publicationDocument.identifier]: false }));
        }
    }

    public async returnPublication(
        publicationDocument: PublicationDocument,
    ): Promise<PublicationDocument> {

        const rootState = this.store.getState();
        if (rootState.lcp.publicationFileLocks[publicationDocument.identifier]) {
            return Promise.reject(`Publication file lock busy ${publicationDocument.identifier}`);
        }
        this.store.dispatch(lcpActions.publicationFileLock.build({ [publicationDocument.identifier]: true }));
        try {
            let r2Publication = await this.publicationViewConverter.unmarshallR2Publication(publicationDocument); // , true

            // Refresh first and continue with the returned saved document.
            const checked = await this.checkPublicationLicenseUpdate_(publicationDocument, r2Publication, false);
            let newPubDocument = checked.publicationDocument;
            r2Publication = checked.r2Publication;

            let redoHash = false;
            if (r2Publication.LCP?.LSD?.Links) {
                const returnLink = r2Publication.LCP.LSD.Links.find((l) => {
                    return l.HasRel("return");
                });
                if (!returnLink) {
                    debug("!returnLink");
                    this.store.dispatch(toastActions.openRequest.build(ToastType.Error,
                        `LCP [${this.translator.translate("publication.returnButton")}] 👎`,
                    ));
                    return newPubDocument;
                }
                if (returnLink.Type !== ContentType.Lsd) {
                    if (returnLink.Type === ContentType.Html || returnLink.Type === ContentType.Xhtml) {
                        if (returnLink.Href && /^https?:\/\//.test(returnLink.Href)) { // ignores file: mailto: data: thoriumhttps: httpsr2: thorium: opds: etc.
                            await shell.openExternal(returnLink.Href);
                        }
                        return newPubDocument;
                    }
                    debug(`returnLink.Type: ${returnLink.Type}`);
                    this.store.dispatch(toastActions.openRequest.build(ToastType.Error,
                        `LCP [${this.translator.translate("publication.returnButton")}] 👎`,
                    ));
                    return newPubDocument;
                }

                let returnResponseLsd: LSD;
                try {
                    returnResponseLsd =
                        await this.lsdManager.lsdReturn(r2Publication.LCP.LSD);
                } catch (err) {
                    debug(err);
                    this.store.dispatch(toastActions.openRequest.build(ToastType.Error,
                        `LCP [${this.translator.translate("publication.returnButton")}]: ${err}`,
                        ));
                }
                if (returnResponseLsd) {
                    debug(returnResponseLsd);
                    r2Publication.LCP.LSD = returnResponseLsd;

                    redoHash = false;
                    let documentPatch: Partial<PublicationDocumentWithoutTimestampable> | undefined;
                    let publicationFilesReplacement: IPublicationFilesReplacement | undefined;
                    try {
                        const result = await this.processStatusDocument(
                            newPubDocument,
                            r2Publication,
                        );
                        r2Publication = result.r2Publication;
                        documentPatch = result.documentPatch;
                        publicationFilesReplacement = result.publicationFilesReplacement;

                        debug(r2Publication.LCP);
                        debug(r2Publication.LCP.LSD);

                    } catch (err) {
                        debug(err);
                    }

                    if ((r2Publication as any).__LCP_LSD_UPDATE_COUNT) {
                        debug("processStatusDocument LCP updated.");
                        redoHash = true;
                    }

                    const newEndDate = r2Publication.LCP && r2Publication.LCP.Rights && r2Publication.LCP.Rights.End ?
                        r2Publication.LCP.Rights.End.toISOString() : "";
                    this.store.dispatch(toastActions.openRequest.build(ToastType.Success,
                        `LCP [${this.translator.translate("publication.returnButton")}] ${newEndDate}`,
                        ));

                    const epubPath = await this.publicationStorage.getPublicationEpubPath(
                        publicationDocument.identifier,
                    );
                    const newPublicationDocument: PublicationDocumentWithoutTimestampable = {
                        ...newPubDocument,
                        ...(documentPatch || {}),
                        hash: redoHash ? await extractCrc32OnZip(epubPath) : newPubDocument.hash,
                    };

                    // updateDocumentLcp writes LCP info onto this freshly-created document object.
                    try {
                        await this.updateDocumentLcp(newPublicationDocument, r2Publication.LCP);

                        newPubDocument = await this.publicationRepository.save(newPublicationDocument);
                        await this.finalizePublicationFilesReplacement(publicationFilesReplacement);
                    } catch (err) {
                        await this.rollbackPublicationFilesReplacement(publicationFilesReplacement);
                        throw err;
                    }
                } else {
                    this.store.dispatch(toastActions.openRequest.build(ToastType.Error,
                        `LCP [${this.translator.translate("publication.returnButton")}] 👎`,
                    ));
                }
            }

            return Promise.resolve(newPubDocument);
        } finally {
            this.store.dispatch(lcpActions.publicationFileLock.build({ [publicationDocument.identifier]: false }));
        }
    }

    public convertUnlockPublicationResultToString(val: any, licenseIssueDate: string): string | undefined {
        let message: string | undefined;
        if (typeof val === "string") {
            message = val;
        } else if (typeof val === "number") {
            switch (val as number) {
                case 0: {
                    message = "NONE: " + val;
                    break;
                }
                case 1: {
                    // message = "INCORRECT PASSPHRASE: " + val;
                    message = this.translator.translate("publication.incorrectPassphrase");
                    break;
                }
                case 11: {
                    // message = "LICENSE_OUT_OF_DATE: " + val;
                    message = this.translator.translate("publication.licenseOutOfDate");
                    break;
                }
                case 101: {
                    // message = "CERTIFICATE_REVOKED: " + val;
                    message = this.translator.translate("publication.certificateRevoked");
                    break;
                }
                case 102: {
                    // message = "CERTIFICATE_SIGNATURE_INVALID: " + val;
                    message = this.translator.translate("publication.certificateSignatureInvalid");
                    break;
                }
                case 111: {
                    // message = "LICENSE_CERTIFICATE_DATE_INVALID (was LICENSE_SIGNATURE_DATE_INVALID): " + val;
                    message = this.translator.translate("publication.licenseCertificateDateInvalid", { dateTime: licenseIssueDate });
                    break;
                }
                case 112: {
                    // message = "LICENSE_SIGNATURE_INVALID: " + val;
                    message = this.translator.translate("publication.licenseSignatureInvalid");
                    break;
                }
                case 121: {
                    message = "CONTEXT_INVALID: " + val;
                    break;
                }
                case 131: {
                    message = "CONTENT_KEY_DECRYPT_ERROR: " + val;
                    break;
                }
                case 141: {
                    // message = "USER_KEY_CHECK_INVALID: " + val;
                    message = this.translator.translate("publication.userKeyCheckInvalid");
                    break;
                }
                case 151: {
                    message = "CONTENT_DECRYPT_ERROR: " + val;
                    break;
                }
                default: {
                    message = "Unknown error?! " + val;
                }
            }
        } else if (val && typeof val === "object"
            // val.toString &&
            // typeof val.toString === "function"
            ) {
                message = (val as object).toString();
        }

        return message;
    }

    // if the publication is not yet loaded in the streamer (streamer.cachedPublication())
    // then we just unlock a transient in-memory R2Publication, so must make sure to subsequently unlock
    // the "proper" streamer-hosted publication in order to decrypt resources!
    // TODO: improve this horrible returned union type!
    public async unlockPublication(publicationDocument: PublicationDocument, passphrase: string | undefined):
        Promise<string | number | null | undefined> {

        let lcpPasses: string[] | undefined;
        let passphraseHash: string | undefined;
        if (passphrase) {
            passphraseHash = toSha256Hex(passphrase);
            lcpPasses = [passphraseHash];
        } else {
            const secrets = await this.getSecrets(publicationDocument);
            if (!secrets || !secrets.length) {
                return null;
            }
            lcpPasses = secrets;
        }

        const publicationIdentifier = publicationDocument.identifier;
        const epubPath = await this.publicationStorage.getPublicationEpubPath(publicationIdentifier);
        // const r2Publication = await this.streamer.loadOrGetCachedPublication(epubPath);

        // let r2Publication = _USE_HTTP_STREAMER ?
        //     this.streamer.cachedPublication(epubPath) :
        //     streamerCachedPublication(epubPath);
        let r2Publication = streamerCachedPublication(epubPath);

        if (!r2Publication) {
            r2Publication = await this.publicationViewConverter.unmarshallR2Publication(publicationDocument); // , true
            // if (r2Publication.LCP) {
            //     r2Publication.LCP.init();
            // }
        }
        // else {
        //     // The streamer at this point should not host an instance of this R2Publication,
        //     // because we normally ensure readers are closed before performing LCP/LSD
        //     debug(`>>>>>>> streamer.cachedPublication() ?! ${publicationIdentifier} ${epubPath}`);
        // }
        if (!r2Publication) {
            debug("unlockPublication !r2Publication ?");
            return null;
        }
        if (!r2Publication.LCP) {
            debug("unlockPublication !r2Publication.LCP ?");
            return null;
        }

        if ((
            __TH__IS_DEV__
            && !r2Publication.LCP.isNativeNodePlugin() // comment this to trigger the error in DEV mode even if the native LCP module is available
            )
            || __TH__IS_CI__) { // !__TH__IS_DEV__ && __TH__IS_PACKAGED__
            try {
                dialog.showErrorBox("LCP", this.translator.translate("publication.lcpNotSupported"));
            } catch {
                // ignore
            }
        }

        try {
            await r2Publication.LCP.tryUserKeys(lcpPasses);
            debug("LCP pass okay");
            if (passphraseHash) {
                await this.saveSecret(publicationDocument, passphraseHash);
            }
        } catch (err: any) {
            debug("FAIL publication.LCP.tryUserKeys()", err);
            return err as string | number | null | undefined;
            // DRMErrorCode (from r2-lcp-client)
            // 1 === NO CORRECT PASSPHRASE / UERKEY IN GIVEN ARRAY
            //     // No error
            //     NONE = 0,
            //     /**
            //         WARNING ERRORS > 10
            //     **/
            //     // License is out of date (check start and end date)
            //     LICENSE_OUT_OF_DATE = 11,
            //     /**
            //         CRITICAL ERRORS > 100
            //     **/
            //     // Certificate has been revoked in the CRL
            //     CERTIFICATE_REVOKED = 101,
            //     // Certificate has not been signed by CA
            //     CERTIFICATE_SIGNATURE_INVALID = 102,
            //     // License has been issued by an expired certificate
            //     LICENSE_CERTIFICATE_DATE_INVALID (was LICENSE_SIGNATURE_DATE_INVALID) = 111,
            //     // License signature does not match
            //     LICENSE_SIGNATURE_INVALID = 112,
            //     // The drm context is invalid
            //     CONTEXT_INVALID = 121,
            //     // Unable to decrypt encrypted content key from user key
            //     CONTENT_KEY_DECRYPT_ERROR = 131,
            //     // User key check invalid
            //     USER_KEY_CHECK_INVALID = 141,
            //     // Unable to decrypt encrypted content from content key
            //     CONTENT_DECRYPT_ERROR = 151
        }

        // import { doTryLcpPass } from "@r2-navigator-js/electron/main/lcp";
        // try {
        //     await doTryLcpPass(
        //         this.streamer,
        //         epubPath,
        //         lcpPasses,
        //         true, // isSha256Hex
        //     );
        //     debug("LCP pass okay");
        //     if (passphraseHash) {
        //         await this.saveSecret(publicationDocument, passphraseHash);
        //     }
        // } catch (err) {
        //     return err;
        // }

        return undefined;
    }

    // , r2LSDJson: JsonMap
    // , r2LCPJson: JsonMap
    private convertLcpLsdInfo(lcp: LCP): LcpInfo {

        let dateStr1 = "";
        try {
            dateStr1 = lcp.Issued?.toISOString();
        } catch (err) {
            debug(err);
        }
        let dateStr2 = "";
        try {
            dateStr2 = lcp.Updated?.toISOString();
        } catch (err) {
            debug(err);
        }
        let dateStr3 = "";
        try {
            dateStr3 = lcp.Rights?.Start?.toISOString();
        } catch (err) {
            debug(err);
        }
        let dateStr4 = "";
        try {
            dateStr4 = lcp.Rights?.End?.toISOString();
        } catch (err) {
            debug(err);
        }
        const lcpInfo: LcpInfo = {
            provider: lcp.Provider,
            issued: dateStr1,
            updated: dateStr2,
            rights: lcp.Rights ? {
                copy: lcp.Rights.Copy,
                print: lcp.Rights.Print,
                start: dateStr3,
                end: dateStr4,
            } : undefined,

            // r2LCPJson,
            // Legacy Base64 data blobs
            // r2LCPBase64,

            textHint: lcp.Encryption.UserKey.TextHint ? lcp.Encryption.UserKey.TextHint : "",
        };

        if (lcp.Links) {
            const statusLink = lcp.Links.find((link) => {
                return link.Rel === "status";
            });
            if (statusLink) {
                lcpInfo.lsd = {
                    statusUrl: statusLink.Href,

                    // r2LSDJson,
                    // Legacy Base64 data blobs
                    // r2LSDBase64,
                };
            }

            const urlHint = lcp.Links.find((link) => {
                return link.Rel === "hint";
            });
            if (typeof urlHint?.Href === "string") {
                lcpInfo.urlHint = {
                    href: urlHint.Href,
                    title: urlHint.Title ?? undefined,
                    type: urlHint.Type ?? undefined,
                };
            }
        }

        if (lcp.LSD && lcpInfo.lsd) {
            let dateStr5 = "";
            try {
                dateStr5 = lcp.LSD.Updated?.License?.toISOString();
            } catch (err) {
                debug(err);
            }
            let dateStr6 = "";
            try {
                dateStr6 = lcp.LSD.Updated?.Status?.toISOString();
            } catch (err) {
                debug(err);
            }
            lcpInfo.lsd.lsdStatus = {
                id: lcp.LSD.ID,
                status: lcp.LSD.Status,
                message: lcp.LSD.Message,
                updated: {
                    license: dateStr5,
                    status: dateStr6,
                },
                // events: lcp.LSD.Events ? lcp.LSD.Events.map((ev) => {
                //     let dateStr7 = "";
                //     try {
                //         dateStr7 = ev.TimeStamp?.toISOString();
                //     } catch (err) {
                //         debug(err);
                //     }
                //     return {
                //         id: ev.ID,
                //         name: ev.Name,
                //         timeStamp: dateStr7,
                //         type: ev.Type, // r2-lcp-js TypeEnum
                //     };
                // }) : undefined,
                links: lcp.LSD.Links ? lcp.LSD.Links.map((link) => {
                    return {
                        length: link.Length,
                        href: link.Href,
                        title: link.Title,
                        type: link.Type,
                        templated: link.Templated,
                        profile: link.Profile,
                        hash: link.Hash,
                        rel: link.Rel,
                    };
                }) : undefined,
            } as LsdStatus;
        }

        return lcpInfo;
    }

    private findLcpPublicationLink(lcp: LCP | undefined): LcpLink | undefined {
        return lcp?.Links?.find((link) => link.HasRel("publication"));
    }

    private getFiniteLcpLinkLength(link: LcpLink | undefined): number | undefined {
        return typeof link?.Length === "number" && Number.isFinite(link.Length) ?
            link.Length :
            undefined;
    }

    // private normalizeLcpPublicationLinkHref(link: LcpLink | undefined): string | undefined {

    //     if (typeof link?.Href !== "string") {
    //         return undefined;
    //     }

    //     const href = link.Href.trim();
    //     if (!href) {
    //         return undefined;
    //     }

    //     try {
    //         return new URL(href).toString();
    //     } catch {
    //         return href;
    //     }
    // }

    /**
     * Decide whether two LCP publication links point to different archive content.
     *
     * Hash and length identify the archive payload. Href comparison is
     * intentionally disabled so a license update that changes only the download
     * URL does not trigger an unnecessary replacement.
     *
     * @param previousLink Publication link from the currently stored LCP license.
     * @param nextLink Publication link from the refreshed LCP license.
     * @returns True when the stored publication archive should be replaced.
     */
    private lcpPublicationLinkResourceChanged(
        previousLink: LcpLink | undefined,
        nextLink: LcpLink | undefined,
    ): boolean {

        if (!previousLink || !nextLink?.Href) {
            return false;
        }

        const previousHash = normalizeSha256HashForComparison(previousLink.Hash);
        const nextHash = normalizeSha256HashForComparison(nextLink.Hash);
        if (previousHash && nextHash && previousHash !== nextHash) {
            debug("LCP publication link hash changed", previousHash, nextHash);
            return true;
        }

        const previousLength = this.getFiniteLcpLinkLength(previousLink);
        const nextLength = this.getFiniteLcpLinkLength(nextLink);
        if (
            typeof previousLength === "number" &&
            typeof nextLength === "number" &&
            previousLength !== nextLength
        ) {
            debug("LCP publication link length changed", previousLength, nextLength);
            return true;
        }

        // Do not compare href here; hash and length are the resource signals
        // that should drive archive replacement.
        // const previousHref = this.normalizeLcpPublicationLinkHref(previousLink);
        // const nextHref = this.normalizeLcpPublicationLinkHref(nextLink);
        // if (previousHref && nextHref && previousHref !== nextHref) {
        //     debug("LCP publication link URL changed", previousHref, nextHref);
        //     return true;
        // }

        return false;
    }

    private getPublicationLinkExtension(link: LcpLink, fallbackExtension: string): string {

        const contentType = parseContentType(link.Type);
        const extWithType = findExtWithMimeType(contentType || link.Type);
        if (extWithType) {
            return extWithType;
        }

        try {
            const extWithDot = path.extname(new URL(link.Href).pathname);
            if (extWithDot) {
                return extWithDot.replace(/^\./, "");
            }
        } catch (err) {
            debug("LCP publication link URL cannot provide extension", link.Href, err);
        }

        if (fallbackExtension) {
            return fallbackExtension.replace(/^\./, "");
        }

        // Last-resort compatibility fallback: without link type, href extension,
        // or the current archive extension, the archive format is unknown. The LCPL
        // injector's generic path is EPUB-style, so keep the temp filename aligned
        // with that default.
        // see: injectLcplIntoZip_ src/main/services/lcp.ts:222
        return acceptedExtensionObject.epub.replace(/^\./, "");
    }

    private async checkDownloadedPublicationLinkIntegrity(
        filePath: string,
        link: LcpLink,
    ): Promise<void> {

        const expectedLength = this.getFiniteLcpLinkLength(link);
        if (typeof expectedLength === "number") {
            const stat = await fs.promises.stat(filePath);
            if (stat.size !== expectedLength) {
                throw new Error(`Downloaded publication length mismatch: expected ${expectedLength}, got ${stat.size}`);
            }
        }

        if (typeof link.Hash === "string" && link.Hash.trim()) {
            const actualHash = await computeFileSha256(filePath);
            if (!fileSha256MatchesExpectedHash(link.Hash, actualHash)) {
                throw new Error(`Downloaded publication SHA-256 mismatch: expected ${link.Hash}, got ${actualHash.hex} / ${actualHash.base64}`);
            }
        }
    }

    /**
     * Downloads the publication archive referenced by an LCP "publication" link
     * into a temporary directory and verifies the link metadata before returning.
     *
     * The returned path remains owned by the caller, which must remove the temp
     * directory after copying or staging the archive.
     *
     * TODO: Extract the shared non-saga download primitive used here and in
     * downloader.ts: HTTP request setup, temp file creation, stream pipeline, and
     * length/hash integrity checks. Keep UI progress/cancel handling in the saga.
     */
    private async downloadPublicationArchiveFromLcpLink(
        publicationIdentifier: string,
        link: LcpLink,
        fallbackExtension: string,
    ): Promise<string> {

        if (!link.Href || !isURL(link.Href)) {
            throw new Error("invalid LCP publication URL: " + link.Href);
        }

        const locale = this.store.getState().i18n.locale;
        const abortController = new AbortController();
        // Let httpGet apply its default HTTP timeout instead of the shorter LSD
        // status timeout: this request fetches a full replacement publication
        // archive, not just a small status JSON document. The local
        // AbortController is not for user cancellation; it keeps this aligned
        // with downloader.ts by using httpGet's clearable timeout branch for the
        // initial HTTP response, then lets pipeline() consume the archive stream.
        const httpDataReceived = await httpGet(
            link.Href,
            {
                abortController,
                signal: abortController.signal,
            },
            undefined,
            locale,
        );
        const contentType = parseContentType(httpDataReceived.contentType);
        if (contentTypeisApiProblem(contentType)) {
            const { title, type } = await parseProblemDetails(httpDataReceived.response);
            throw new Error(`${title} (${type})`);
        }

        if (!httpDataReceived.isSuccess || !httpDataReceived.body) {
            throw new Error(`LCP publication download failed: ${httpDataReceived.statusMessage || ""} (${httpDataReceived.statusCode || ""})`);
        }

        let tempDir: string | undefined;
        try {
            const ext = this.getPublicationLinkExtension(link, fallbackExtension);
            tempDir = await createTempDir(`${Date.now()}-${publicationIdentifier}`, "lcp-publication-update");
            const downloadedPublicationPath = path.join(tempDir, `book.${ext}`);
            // pipeline() handles stream backpressure and rejects on either HTTP
            // body or filesystem write errors. The HTTP timeout above guards the
            // initial response; the archive body is allowed to stream to disk.
            await pipeline(httpDataReceived.body, fs.createWriteStream(downloadedPublicationPath));
            await this.checkDownloadedPublicationLinkIntegrity(downloadedPublicationPath, link);

            return downloadedPublicationPath;
        } catch (err) {
            if (tempDir) {
                await rmrf(tempDir).catch((e) => debug("downloadPublicationArchiveFromLcpLink cleanup failed", e));
            }
            throw err;
        }
    }

    private buildPublicationArchiveDocumentPatch(
        publicationDocument: PublicationDocument,
        r2Publication: R2Publication,
        publicationFiles: File[],
    ): Partial<PublicationDocumentWithoutTimestampable> {

        const locale = this.store.getState().i18n.locale;
        // Recompute only the stored-file fields affected by the archive swap:
        // the main book file, any extracted cover, and the custom-cover fallback.
        const filesPatch = buildPublicationFilesDocumentPatch(
            publicationFiles,
            publicationDocument.customCover,
        );

        return {
            // Prefer the replacement archive's localized metadata title, but keep
            // the previous document title if the new archive does not expose one.
            title: convertMultiLangStringToString(r2Publication.Metadata.Title, locale) ||
                publicationDocument.title ||
                "-",
            ...filesPatch,
        };
    }

    /**
     * Replace Publication Archive If Link Changed
     *
     * During an LCP license refresh, the new license may point to an updated
     * publication archive. This method detects that case, downloads the replacement
     * archive, embeds the refreshed LCPL into it, parses it, stages the stored-file
     * replacement, and updates the publication cache.
     *
     * The returned file replacement is still pending: the caller must finalize it
     * only after the related publication document has been saved, or roll it back if
     * a later step fails.
     *
     * @param publicationDocument Existing publication document being refreshed.
     * @param previousLcp LCP license currently associated with the stored archive.
     * @param nextLcp Refreshed LCP license received from the status document flow.
     * @param nextLcpStr Raw refreshed LCPL JSON to inject into the replacement archive.
     * @returns Archive update data when replacement was staged, or undefined when
     * the refreshed LCP does not require an archive replacement.
     */
    private async replacePublicationArchiveIfLinkChanged(
        publicationDocument: PublicationDocument,
        previousLcp: LCP,
        nextLcp: LCP,
        nextLcpStr: string,
    ): Promise<IPublicationArchiveUpdateResult | undefined> {

        // The refreshed LCP may point to a newer publication archive. Replace the
        // stored book when the publication link URL or resource metadata changed.
        const previousPublicationLink = this.findLcpPublicationLink(previousLcp);
        const nextPublicationLink = this.findLcpPublicationLink(nextLcp);
        debug("replacePublicationArchiveIfLinkChanged check", {
            hasNextPublicationLink: !!nextPublicationLink,
            hasPreviousPublicationLink: !!previousPublicationLink,
            identifier: publicationDocument.identifier,
            nextLength: this.getFiniteLcpLinkLength(nextPublicationLink),
            previousLength: this.getFiniteLcpLinkLength(previousPublicationLink),
        });
        if (
            !nextPublicationLink ||
            !this.lcpPublicationLinkResourceChanged(previousPublicationLink, nextPublicationLink)
        ) {
            debug("replacePublicationArchiveIfLinkChanged no archive replacement needed", publicationDocument.identifier);
            return undefined;
        }

        debug("replacePublicationArchiveIfLinkChanged archive changed, downloading updated publication", publicationDocument.identifier);

        let downloadedPublicationPath: string | undefined;
        let publicationFilesReplacement: IPublicationFilesReplacement | undefined;
        try {
            const currentPublicationPath = await this.publicationStorage.getPublicationEpubPath(
                publicationDocument.identifier,
            );
            debug("replacePublicationArchiveIfLinkChanged current publication path", publicationDocument.identifier, currentPublicationPath);
            downloadedPublicationPath = await this.downloadPublicationArchiveFromLcpLink(
                publicationDocument.identifier,
                nextPublicationLink,
                path.extname(currentPublicationPath),
            );
            debug("replacePublicationArchiveIfLinkChanged downloaded replacement archive", publicationDocument.identifier, downloadedPublicationPath);

            // Persist the refreshed license inside the downloaded archive before parsing
            // and storing it, so the replacement archive is immediately self-contained.
            await this.injectLcplIntoZip_(downloadedPublicationPath, nextLcpStr);
            debug("replacePublicationArchiveIfLinkChanged injected refreshed LCPL", publicationDocument.identifier, downloadedPublicationPath);

            const updatedR2Publication = await PublicationParsePromise(downloadedPublicationPath);
            updatedR2Publication.freeDestroy();
            updatedR2Publication.LCP = nextLcp;
            debug("replacePublicationArchiveIfLinkChanged parsed replacement archive", publicationDocument.identifier);

            // The replacement is staged so the caller can save the updated publication
            // document first, then finalize or roll back the file swap as one operation.
            publicationFilesReplacement = await this.publicationStorage.replacePublicationFiles(
                publicationDocument.identifier,
                downloadedPublicationPath,
            );
            debug("replacePublicationArchiveIfLinkChanged staged publication files replacement", {
                fileCount: publicationFilesReplacement.files.length,
                identifier: publicationDocument.identifier,
            });
            const documentPatch = this.buildPublicationArchiveDocumentPatch(
                publicationDocument,
                updatedR2Publication,
                publicationFilesReplacement.files,
            );
            debug("replacePublicationArchiveIfLinkChanged built publication document patch", {
                hasCoverFile: !!documentPatch.coverFile,
                hasCustomCover: !!documentPatch.customCover,
                identifier: publicationDocument.identifier,
                title: documentPatch.title,
            });

            await this.publicationViewConverter.updatePublicationCache(
                {
                    ...publicationDocument,
                    ...documentPatch,
                },
                updatedR2Publication,
            );
            debug("replacePublicationArchiveIfLinkChanged updated publication cache", publicationDocument.identifier);

            return {
                documentPatch,
                publicationFilesReplacement,
                r2Publication: updatedR2Publication,
            };
        } catch (err) {
            debug("replacePublicationArchiveIfLinkChanged failed, rolling back replacement", publicationDocument.identifier, err);
            // If parsing, cache refresh, or any later step fails, restore the previous
            // stored files before propagating the error to the caller.
            await this.rollbackPublicationFilesReplacement(publicationFilesReplacement);
            throw err;
        } finally {
            if (downloadedPublicationPath) {
                // downloadPublicationArchiveFromLcpLink creates a temp directory whose
                // only durable output is copied into publication storage above.
                debug("replacePublicationArchiveIfLinkChanged cleanup temp archive", publicationDocument.identifier, downloadedPublicationPath);
                await rmrf(path.dirname(downloadedPublicationPath))
                    .catch((e) => debug("replacePublicationArchiveIfLinkChanged cleanup failed", e));
            }
        }
    }

    public async processStatusDocument(
        publicationDocument: PublicationDocument,
        r2Publication: R2Publication,
    ): Promise<IProcessStatusDocumentResult> {

        (r2Publication as any).__LCP_LSD_UPDATE_COUNT = 0;

        if (!r2Publication.LCP) {
            return Promise.reject("processStatusDocument NO LCP data!");
        }



        return new Promise(async (resolve, reject) => {
            const callback = async (r2LCPStr: string | undefined) => {
                debug("launchStatusDocumentProcessing DONE.");
                debug(r2LCPStr);

                // r2Publication.LCP.LSD.Status !== StatusEnum.Active && r2Publication.LCP.LSD.Status !== StatusEnum.Ready
                if (r2Publication.LCP.LSD &&
                    (r2Publication.LCP.LSD.Status === StatusEnum.Revoked
                    || r2Publication.LCP.LSD.Status === StatusEnum.Returned
                    || r2Publication.LCP.LSD.Status === StatusEnum.Cancelled
                    || r2Publication.LCP.LSD.Status === StatusEnum.Expired)) {
                    // TODO anything here just in case the LCP license end date is still "open" in the future? We assume it is now closed (subsequent attempts to load book will fail).
                    // The license is supposed to be the source of truth, so it should have been correspondingly updated by server...maybe too optimistic assumption?
                }

                if (r2LCPStr) {

                    const atLeastOneReaderIsOpen = await diMainGet("saga-middleware").run(RequesetToCloseAllReadersWithTheSamePubId, publicationDocument.identifier).toPromise<boolean>() // NOTE: no type inference with Task .toPromise
                        .catch((e) => { debug("RequesetToCloseAllReadersWithTheSamePubId", e); });
                    debug("RequesetToCloseAllReadersWithTheSamePubId fulfilled");
                    // let atLeastOneReaderIsOpen = false;
                    // const readers = this.store.getState().win.session.reader;
                    // if (readers) {
                    //     for (const reader of Object.values(readers)) {
                    //         if (reader.publicationIdentifier === publicationIdentifier) {
                    //             atLeastOneReaderIsOpen = true;
                    //             break;
                    //         }
                    //     }
                    // }
                    // if (atLeastOneReaderIsOpen) {
                    //     // this.store.dispatch(readerActions.closeRequestFromPublication.build(
                    //     //     publicationDocumentIdentifier));
                    // }
                    if (atLeastOneReaderIsOpen) {
                        await new Promise<void>((res, _rej) => {
                            setTimeout(() => {
                                res();
                            }, 500); // allow extra completion time to ensure the filesystem ZIP streams are closed
                        });
                    }

                    try {
                        // --------- This LSD was set in launchStatusDocumentProcessing() so it is up to date in the context of r2Publication.LCP,
                        // but we are receiving a new LCP license so need to reassign later...
                        const prevLCP = r2Publication.LCP;
                        const prevLSD = prevLCP.LSD;

                        // const epubPath_ = await lsdLcpUpdateInject(
                        //     licenseUpdateJson,
                        //     r2Publication,
                        //     epubPath);

                        const r2LCPJson = global.JSON.parse(r2LCPStr);
                        debug(r2LCPJson);

                        if (lcpLicenseIsNotWellFormed(r2LCPJson)) {
                            const rej = `LCP license malformed: ${JSON.stringify(r2LCPJson)}`;
                            debug(rej);
                            reject(rej);
                            return;
                        }

                        let r2LCP: LCP;
                        try {
                            r2LCP = TaJsonDeserialize(r2LCPJson, LCP);
                        } catch (erorz) {
                            debug(erorz);
                            reject(erorz);
                            return;
                        }
                        r2LCP.JsonSource = r2LCPStr;

                        const archiveUpdate = await this.replacePublicationArchiveIfLinkChanged(
                            publicationDocument,
                            prevLCP,
                            r2LCP,
                            r2LCPStr,
                        );
                        if (archiveUpdate) {
                            r2Publication = archiveUpdate.r2Publication;
                            r2Publication.LCP = r2LCP;
                            r2Publication.LCP.LSD = prevLSD;
                            (r2Publication as any).__LCP_LSD_UPDATE_COUNT = 1; // TODO: this is used elsewhere to trigger the recalculation of the pub hash, should really be a proper typed flag, not "any"
                            resolve({
                                documentPatch: archiveUpdate.documentPatch,
                                publicationFilesReplacement: archiveUpdate.publicationFilesReplacement,
                                r2Publication,
                            });
                            return;
                        }

                        r2Publication.LCP = r2LCP;

                        // --------- will be updated below via another round of processStatusDocument_() UPDATE: no, see below ...
                        r2Publication.LCP.LSD = prevLSD;

                        const epubPath = await this.publicationStorage.getPublicationEpubPath(
                            publicationDocument.identifier,
                        );
                        await this.injectLcplIntoZip_(epubPath, r2LCPStr);

                        // --------- see the prevLSD assignment above, and the processStatusDocument_() call below
                        // ... we avoid the second LSD network request which is deemed unnecessary in the real world
                        if (!(r2Publication as any).__LCP_LSD_UPDATE_COUNT) {
                            (r2Publication as any).__LCP_LSD_UPDATE_COUNT = 1; // TODO: this is used elsewhere to trigger the recalculation of the pub hash, should really be a proper typed flag, not "any"
                        }
                        resolve({
                            r2Publication,
                        });
                        // --------- below is the commented code that used to create the second LSD network request:
                        // // Protect against infinite loop due to incorrect LCP / LSD server dates
                        // if (!(r2Publication as any).__LCP_LSD_UPDATE_COUNT) {
                        //     (r2Publication as any).__LCP_LSD_UPDATE_COUNT = 1;
                        // } else {
                        //     (r2Publication as any).__LCP_LSD_UPDATE_COUNT++;
                        // }
                        // if ((r2Publication as any).__LCP_LSD_UPDATE_COUNT > 2) {
                        //     debug("__LCP_LSD_UPDATE_COUNT!?");
                        //     resolve();
                        // } else {
                        //     try {
                        //         // loop to re-init LSD in updated LCP
                        //         await this.processStatusDocument_(
                        //             publicationDocumentIdentifier,
                        //             r2Publication);

                        //         // TODO: publicationFileLock by checkPublicationLicenseUpdate(), so does not work
                        //         if (atLeastOneReaderIsOpen) {
                        //             this.store.dispatch(readerActions.openRequest.build(publicationDocumentIdentifier));
                        //         }
                        //         resolve();
                        //     } catch (err) {
                        //         debug(err);
                        //         reject(err);
                        //     }
                        // }
                    } catch (err) {
                        debug(err);
                        reject(err);
                    }
                } else {
                    resolve({
                        r2Publication,
                    });
                }
            };

            // use this to temporarily bypass LSD checks during dev
            if (__TH__SKIP_LCP_LSD__) {
                await callback(undefined);
                return;
            }
            try {
                const r2LCPStr = await this.lsdManager.launchStatusDocumentProcessing(r2Publication.LCP);
                await callback(r2LCPStr);
            } catch (err) {
                debug(err);

                // ignore uncaught promise rejections
                // (other possible errors in LSD protocol, network issues, etc.)
                // reject(err);
                await callback(undefined);
            }
        });
    }

    // HTTP statusCode < 200 || >= 300.
    // "err" can be:
    //
    // a number (HTTP status code) when no response body is available.
    //
    // an object with the `httpStatusCode` property (number)
    // and httpResponseBody (string) when the response body cannot be parsed to JSON.
    //
    // an object with the `httpStatusCode` property (number)
    // and other arbitrary JSON properties,
    // depending on the server response.
    // Typically, compliant LCP/LSD servers are expected to return
    // Problem Details JSON (RFC7807),
    // which provides `title` `type` and `details` JSON properties.
    // See https://readium.org/lcp-specs/releases/lsd/latest#31-handling-errors

    // TODO in LSD class
    // private stringifyLsdError(err: any): string {
    //     if (typeof err === "number") {
    //         return `${err}`;
    //     }
    //     if (!err) {
    //         return "";
    //     }
    //     if (typeof err === "object") {
    //         if (err.httpStatusCode) {
    //             if (err.httpResponseBody) {
    //                 return `${err.httpStatusCode} (${err.httpResponseBody})`;
    //             }
    //             if (err.title && err.detail) {
    //                 return `${err.httpStatusCode} (${err.title} - ${err.detail})`;
    //             }
    //         }
    //         return JSON.stringify(err);
    //     }
    //     return err;
    // }
}
