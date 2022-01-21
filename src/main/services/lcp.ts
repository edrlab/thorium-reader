// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { shell } from "electron";
import * as fs from "fs";
import { inject, injectable } from "inversify";
import * as moment from "moment";
import * as path from "path";
import { acceptedExtensionObject } from "readium-desktop/common/extension";
import { lcpLicenseIsNotWellFormed } from "readium-desktop/common/lcp";
import { LcpInfo, LsdStatus } from "readium-desktop/common/models/lcp";
import { ToastType } from "readium-desktop/common/models/toast";
import { readerActions, toastActions } from "readium-desktop/common/redux/actions/";
import { Translator } from "readium-desktop/common/services/translator";
import { PublicationViewConverter } from "readium-desktop/main/converter/publication";
import {
    PublicationDocument, PublicationDocumentWithoutTimestampable,
} from "readium-desktop/main/db/document/publication";
import { PublicationRepository } from "readium-desktop/main/db/repository/publication";
import { diSymbolTable } from "readium-desktop/main/diSymbolTable";
import { decryptPersist, encryptPersist } from "readium-desktop/main/fs/persistCrypto";
import { RootState } from "readium-desktop/main/redux/states";
import { PublicationStorage } from "readium-desktop/main/storage/publication-storage";
import { streamerCachedPublication } from "readium-desktop/main/streamer/streamerNoHttp";
import { IS_DEV, LCP_SKIP_LSD } from "readium-desktop/preprocessor-directives";
import { ContentType } from "readium-desktop/utils/contentType";
import { toSha256Hex } from "readium-desktop/utils/lcp";
import { tryCatch } from "readium-desktop/utils/tryCatch";
import { Store } from "redux";

import { lsdRenew_ } from "@r2-lcp-js/lsd/renew";
import { lsdReturn_ } from "@r2-lcp-js/lsd/return";
import { launchStatusDocumentProcessing } from "@r2-lcp-js/lsd/status-document-processing";
import { LCP } from "@r2-lcp-js/parser/epub/lcp";
import { LSD } from "@r2-lcp-js/parser/epub/lsd";
import { TaJsonDeserialize, TaJsonSerialize } from "@r2-lcp-js/serializable";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";
import { injectBufferInZip } from "@r2-utils-js/_utils/zip/zipInjector";

import { lcpHashesFilePath } from "../di";
import { lcpActions } from "../redux/actions";
import { extractCrc32OnZip } from "../tools/crc";
import { DeviceIdManager } from "./device";

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

    @inject(diSymbolTable["device-id-manager"])
    private readonly deviceIdManager!: DeviceIdManager;

    @inject(diSymbolTable.store)
    private readonly store!: Store<RootState>;

    @inject(diSymbolTable.translator)
    private readonly translator!: Translator;

    public async absorbDBToJson() {
        await this.getAllSecrets();
        debug("+++++ LCP secrets absorbDBToJson");
    }

    public async getAllSecrets(): Promise<TLCPSecrets> {
        debug("LCP getAllSecrets ...");

        const buff = await tryCatch(() => fs.promises.readFile(lcpHashesFilePath), "");
        if (buff) {
            debug("LCP getAllSecrets from JSON");

            const str = decryptPersist(buff, CONFIGREPOSITORY_LCP_SECRETS, lcpHashesFilePath);
            if (!str) {
                return {};
            }
            const json = JSON.parse(str);
            return json;
        }

        const json: TLCPSecrets = {};
        return json;
    }

    public async getSecrets(doc: PublicationDocument): Promise<string[]> {
        debug("LCP getSecrets ... ", doc.identifier);

        const secrets: string[] = [];

        const allSecrets = await this.getAllSecrets();
        const ids = Object.keys(allSecrets);
        for (const id of ids) {
            const val = allSecrets[id];
            if (val.passphrase) {
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
        fs.promises.writeFile(lcpHashesFilePath, encrypted);
    }

    public async injectLcplIntoZip_(epubPath: string, lcpStr: string) {

        const extension = path.extname(epubPath);
        const isAudioBook = new RegExp(`\\${acceptedExtensionObject.audiobook}$`).test(extension) ||
            new RegExp(`\\${acceptedExtensionObject.audiobookLcp}$`).test(extension) ||
            new RegExp(`\\${acceptedExtensionObject.audiobookLcpAlt}$`).test(extension);

        const isDivina = new RegExp(`\\${acceptedExtensionObject.divina}$`).test(extension);

        const isLcpPdf = new RegExp(`\\${acceptedExtensionObject.pdfLcp}$`).test(extension);

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

    //     const newPublicationDocument: PublicationDocumentWithoutTimestampable = Object.assign(
    //         {},
    //         publicationDocument,
    //         {
    //             hash: await extractCrc32OnZip(epubPath),
    //         },
    //     );
    //     this.updateDocumentLcp(newPublicationDocument, r2Publication.LCP);

    //     return this.publicationRepository.save(newPublicationDocument);
    // }

    public updateDocumentLcp(
        publicationDocument: PublicationDocumentWithoutTimestampable,
        r2LCP: LCP,
        skipFilesystemCache = false,
    ) {
        // if (!publicationDocument.resources) {
        //     publicationDocument.resources = {};
        // }
        if (r2LCP) {
            // Legacy Base64 data blobs
            // const r2LCPStr = r2LCP.JsonSource ?? JSON.stringify(TaJsonSerialize(r2LCP));
            // publicationDocument.resources.r2LCPBase64 = Buffer.from(r2LCPStr).toString("base64");
            // const r2LCPJson = r2LCP.JsonSource ? JSON.parse(r2LCP.JsonSource) : TaJsonSerialize(r2LCP);
            // publicationDocument.resources.r2LCPJson = r2LCPJson;
            if (!skipFilesystemCache) {
                this.publicationViewConverter.updateLcpCache(publicationDocument, r2LCP);
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

    public async checkPublicationLicenseUpdate(
        publicationDocument: PublicationDocument,
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
            return await this.checkPublicationLicenseUpdate_(publicationDocument, r2Publication);
        } finally {
            this.store.dispatch(lcpActions.publicationFileLock.build({ [publicationDocument.identifier]: false }));
        }
    }

    public async checkPublicationLicenseUpdate_(
        publicationDocument: PublicationDocument,
        r2Publication: R2Publication,
    ): Promise<PublicationDocument> {

        let redoHash = false;
        if (r2Publication.LCP) {
            try {
                await this.processStatusDocument(
                    publicationDocument.identifier,
                    r2Publication,
                );

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

        const epubPath = this.publicationStorage.getPublicationEpubPath(
            publicationDocument.identifier,
        );

        const newPublicationDocument: PublicationDocumentWithoutTimestampable = Object.assign(
            {},
            publicationDocument,
            {
                hash: redoHash ? await extractCrc32OnZip(epubPath) : publicationDocument.hash,
            },
        );
        this.updateDocumentLcp(newPublicationDocument, r2Publication.LCP);

        const newPubDocument = await this.publicationRepository.save(newPublicationDocument);
        return Promise.resolve(newPubDocument);
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
            const locale = rootState.i18n.locale;
            const httpHeaders = {
                "Accept-Language": `${locale},en-US;q=0.7,en;q=0.5`,
                "User-Agent": "readium-desktop",
            };
            // TODO - IDEALLY AS WELL:
            // agentOptions: {
            //     rejectUnauthorized: IS_DEV ? false : true,
            // },

            const r2Publication = await this.publicationViewConverter.unmarshallR2Publication(publicationDocument); // , true

            let newPubDocument = await this.checkPublicationLicenseUpdate_(publicationDocument, r2Publication);

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
                        await shell.openExternal(renewLink.Href);
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
                        await lsdRenew_(endDate, r2Publication.LCP.LSD, this.deviceIdManager, httpHeaders);
                } catch (err) {
                    debug(err);
                    const str = this.stringifyLsdError(err);
                    this.store.dispatch(toastActions.openRequest.build(ToastType.Error,
                        `LCP [${this.translator.translate("publication.renewButton")}]: ${str}`,
                        ));
                }
                if (renewResponseLsd) {
                    debug(renewResponseLsd);
                    r2Publication.LCP.LSD = renewResponseLsd;

                    redoHash = false;
                    try {
                        await this.processStatusDocument(
                            publicationDocument.identifier,
                            r2Publication,
                        );

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

                    const epubPath = this.publicationStorage.getPublicationEpubPath(
                        publicationDocument.identifier,
                    );
                    const newPublicationDocument: PublicationDocumentWithoutTimestampable = Object.assign(
                        {},
                        publicationDocument,
                        {
                            hash: redoHash ? await extractCrc32OnZip(epubPath) : publicationDocument.hash,
                        },
                    );
                    this.updateDocumentLcp(newPublicationDocument, r2Publication.LCP);

                    newPubDocument = await this.publicationRepository.save(newPublicationDocument);
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
            const locale = rootState.i18n.locale;
            const httpHeaders = {
                "Accept-Language": `${locale},en-US;q=0.7,en;q=0.5`,
                "User-Agent": "readium-desktop",
            };
            // TODO - IDEALLY AS WELL:
            // agentOptions: {
            //     rejectUnauthorized: IS_DEV ? false : true,
            // },

            const r2Publication = await this.publicationViewConverter.unmarshallR2Publication(publicationDocument); // , true

            let newPubDocument = await this.checkPublicationLicenseUpdate_(publicationDocument, r2Publication);

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
                        await shell.openExternal(returnLink.Href);
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
                        await lsdReturn_(r2Publication.LCP.LSD, this.deviceIdManager, httpHeaders);
                } catch (err) {
                    debug(err);
                    const str = this.stringifyLsdError(err);
                    this.store.dispatch(toastActions.openRequest.build(ToastType.Error,
                        `LCP [${this.translator.translate("publication.returnButton")}]: ${str}`,
                        ));
                }
                if (returnResponseLsd) {
                    debug(returnResponseLsd);
                    r2Publication.LCP.LSD = returnResponseLsd;

                    redoHash = false;
                    try {
                        await this.processStatusDocument(
                            publicationDocument.identifier,
                            r2Publication,
                        );

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

                    const epubPath = this.publicationStorage.getPublicationEpubPath(
                        publicationDocument.identifier,
                    );
                    const newPublicationDocument: PublicationDocumentWithoutTimestampable = Object.assign(
                        {},
                        publicationDocument,
                        {
                            hash: redoHash ? await extractCrc32OnZip(epubPath) : publicationDocument.hash,
                        },
                    );
                    this.updateDocumentLcp(newPublicationDocument, r2Publication.LCP);

                    newPubDocument = await this.publicationRepository.save(newPublicationDocument);
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

    public convertUnlockPublicationResultToString(val: any): string | undefined {
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
                    message = this.translator.translate("publication.userKeyCheckInvalid");
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
                    // message = "LICENSE_SIGNATURE_DATE_INVALID: " + val;
                    message = this.translator.translate("publication.licenseSignatureDateInvalid");
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
        const epubPath = this.publicationStorage.getPublicationEpubPath(publicationIdentifier);
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

        try {
            await r2Publication.LCP.tryUserKeys(lcpPasses);
            debug("LCP pass okay");
            if (passphraseHash) {
                await this.saveSecret(publicationDocument, passphraseHash);
            }
        } catch (err) {
            debug("FAIL publication.LCP.tryUserKeys()", err);
            return err;
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
            //     LICENSE_SIGNATURE_DATE_INVALID = 111,
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
    public convertLcpLsdInfo(lcp: LCP): LcpInfo {

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

    public async processStatusDocument(
        publicationDocumentIdentifier: string,
        r2Publication: R2Publication): Promise<void> {

        (r2Publication as any).__LCP_LSD_UPDATE_COUNT = 0;
        return this.processStatusDocument_(publicationDocumentIdentifier, r2Publication);
    }

    private async processStatusDocument_(
        publicationDocumentIdentifier: string,
        r2Publication: R2Publication): Promise<void> {

        if (!r2Publication.LCP) {
            return Promise.reject("processStatusDocument NO LCP data!");
        }

        const locale = this.store.getState().i18n.locale;
        const httpHeaders = {
            "Accept-Language": `${locale},en-US;q=0.7,en;q=0.5`,
            "User-Agent": "readium-desktop",
        };
        // TODO - IDEALLY AS WELL:
        // agentOptions: {
        //     rejectUnauthorized: IS_DEV ? false : true,
        // },

        return new Promise(async (resolve, reject) => {
            const callback = async (r2LCPStr: string | undefined) => {
                debug("launchStatusDocumentProcessing DONE.");
                debug(r2LCPStr);

                if (r2LCPStr) {

                    let atLeastOneReaderIsOpen = false;
                    const readers = this.store.getState().win.session.reader;
                    if (readers) {
                        for (const reader of Object.values(readers)) {
                            if (reader.publicationIdentifier === publicationDocumentIdentifier) {
                                atLeastOneReaderIsOpen = true;
                                break;
                            }
                        }
                    }
                    if (atLeastOneReaderIsOpen) {
                        this.store.dispatch(readerActions.closeRequestFromPublication.build(
                            publicationDocumentIdentifier));

                        await new Promise<void>((res, _rej) => {
                            setTimeout(() => {
                                res();
                            }, 500); // allow extra completion time to ensure the filesystem ZIP streams are closed
                        });
                    }

                    try {
                        const prevLSD = r2Publication.LCP.LSD;
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
                        r2Publication.LCP = r2LCP;

                        // will be updated below via another round of processStatusDocument_()
                        r2Publication.LCP.LSD = prevLSD;

                        const epubPath = this.publicationStorage.getPublicationEpubPath(
                            publicationDocumentIdentifier,
                        );
                        await this.injectLcplIntoZip_(epubPath, r2LCPStr);

                        // Protect against infinite loop due to incorrect LCP / LSD server dates
                        if (!(r2Publication as any).__LCP_LSD_UPDATE_COUNT) {
                            (r2Publication as any).__LCP_LSD_UPDATE_COUNT = 1;
                        } else {
                            (r2Publication as any).__LCP_LSD_UPDATE_COUNT++;
                        }
                        if ((r2Publication as any).__LCP_LSD_UPDATE_COUNT > 2) {
                            debug("__LCP_LSD_UPDATE_COUNT!?");
                            resolve();
                        } else {
                            try {
                                // loop to re-init LSD in updated LCP
                                await this.processStatusDocument_(
                                    publicationDocumentIdentifier,
                                    r2Publication);

                                // TODO: publicationFileLock by checkPublicationLicenseUpdate(), so does not work
                                if (atLeastOneReaderIsOpen) {
                                    this.store.dispatch(readerActions.openRequest.build(publicationDocumentIdentifier));
                                }
                                resolve();
                            } catch (err) {
                                debug(err);
                                reject(err);
                            }
                        }
                    } catch (err) {
                        debug(err);
                        reject(err);
                    }
                } else {
                    resolve();
                }
            };

            // use this to temporarily bypass LSD checks during dev
            if (IS_DEV && LCP_SKIP_LSD) {
                await callback(undefined);
                return;
            }
            try {
                await launchStatusDocumentProcessing(
                    r2Publication.LCP,
                    this.deviceIdManager,
                    callback,
                    httpHeaders,
                );
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
    // See https://readium.org/technical/readium-lsd-specification/#31-handling-errors
    private stringifyLsdError(err: any): string {
        if (typeof err === "number") {
            return `${err}`;
        }
        if (!err) {
            return "";
        }
        if (typeof err === "object") {
            if (err.httpStatusCode) {
                if (err.httpResponseBody) {
                    return `${err.httpStatusCode} (${err.httpResponseBody})`;
                }
                if (err.title && err.detail) {
                    return `${err.httpStatusCode} (${err.title} - ${err.detail})`;
                }
            }
            return JSON.stringify(err);
        }
        return err;
    }
}
