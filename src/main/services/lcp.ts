// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import * as fs from "fs";
import { inject, injectable } from "inversify";
import { LcpInfo } from "readium-desktop/common/models/lcp";
import { Publication } from "readium-desktop/common/models/publication";
import { PublicationDocument } from "readium-desktop/main/db/document/publication";
import { LcpSecretRepository } from "readium-desktop/main/db/repository/lcp-secret";
import { PublicationRepository } from "readium-desktop/main/db/repository/publication";
import { diSymbolTable } from "readium-desktop/main/diSymbolTable";
import { PublicationStorage } from "readium-desktop/main/storage/publication-storage";
import { toSha256Hex } from "readium-desktop/utils/lcp";
import { JSON as TAJSON } from "ta-json-x";

import { LCP } from "@r2-lcp-js/parser/epub/lcp";
import { doTryLcpPass } from "@r2-navigator-js/electron/main/lcp";
import { EpubParsePromise } from "@r2-shared-js/parser/epub";
import { Server } from "@r2-streamer-js/http/server";
import { injectBufferInZip } from "@r2-utils-js/_utils/zip/zipInjector";

import { extractCrc32OnZip } from "../crc";

// import { injectDataInZip } from "readium-desktop/utils/zip";
// import * as uuid from "uuid";
// import { LcpSecretDocument } from "../db/document/lcp-secret";
// import { launchStatusDocumentProcessing } from "@r2-lcp-js/lsd/status-document-processing";
// import { DeviceIdManager } from "./device";
// import { httpGet, IHttpGetResult } from "readium-desktop/common/utils/http";
// import { THttpGetPublicationDocument } from "readium-desktop/main/db/document/publication";
// import { lsdRegister } from "@r2-lcp-js/lsd/register";
// import { lsdRenew } from "@r2-lcp-js/lsd/renew";
// import { lsdReturn } from "@r2-lcp-js/lsd/return";

// Logger
const debug = debug_("readium-desktop:main#services/lcp");

@injectable()
export class LcpManager {
    @inject(diSymbolTable["publication-storage"])
    private readonly publicationStorage!: PublicationStorage;

    @inject(diSymbolTable["lcp-secret-repository"])
    private readonly lcpSecretRepository!: LcpSecretRepository;

    @inject(diSymbolTable.streamer)
    private readonly streamer!: Server;

    @inject(diSymbolTable["publication-repository"])
    private readonly publicationRepository!: PublicationRepository;

    // @inject(diSymbolTable["device-id-manager"])
    // private readonly deviceIdManager!: DeviceIdManager;

    /**
     * Inject lcpl document in publication
     *
     * @param PublicationDocument Publication document on which we inject the lcpl
     * @param lcpl: Lcpl object
     */
    public async injectLcpl(
        publicationDocument: PublicationDocument,
        lcp: LCP,
    ): Promise<PublicationDocument> {
        // Get epub file path
        const epubPath = this.publicationStorage.getPublicationEpubPath(
            publicationDocument.identifier,
        );

        const jsonSource = lcp.JsonSource ? lcp.JsonSource : JSON.stringify(TAJSON.serialize(lcp));

        // Inject lcpl in a temporary zip
        debug("Inject LCPL - START", epubPath);
        await new Promise((resolve, reject) => {
            injectBufferInZip(
                epubPath,
                epubPath + ".lcp",
                Buffer.from(jsonSource, "utf8"),
                "META-INF/license.lcpl",
                (e: any) => {
                    debug("injectLcpl - injectBufferInZip ERROR!");
                    debug(e);
                    reject(e);
                },
                () => {
                    resolve();
                });
        });
        debug("Inject LCPL - END", epubPath);

        // Replace epub without LCP with a new one containing LCPL
        fs.unlinkSync(epubPath);
        await new Promise((resolve, _reject) => {
            setTimeout(() => {
                resolve();
            }, 200); // to avoid issues with some filesystems (allow extra completion time)
        });
        fs.renameSync(epubPath + ".lcp", epubPath);
        await new Promise((resolve, _reject) => {
            setTimeout(() => {
                resolve();
            }, 200); // to avoid issues with some filesystems (allow extra completion time)
        });

        debug("Parse publication - START", epubPath);
        const r2Publication = await EpubParsePromise(epubPath);

        let lcpInfo: LcpInfo = null;
        if (r2Publication.LCP) {
            // Add Lcp info
            lcpInfo = {
                provider: r2Publication.LCP.Provider,
                issued: r2Publication.LCP.Issued,
                updated: r2Publication.LCP.Updated,
                rights: r2Publication.LCP.Rights ? {
                    copy: r2Publication.LCP.Rights.Copy,
                    print: r2Publication.LCP.Rights.Print,
                    start: r2Publication.LCP.Rights.Start,
                    end: r2Publication.LCP.Rights.End,
                } : undefined,
            };

            if (r2Publication.LCP.Links) {
                // Search for lsd status url
                for (const link of r2Publication.LCP.Links) {
                    if (link.Rel === "status") {
                        // This is the lsd status url link
                        lcpInfo.lsd = {
                            statusUrl: link.Href,
                        };
                        break;
                    }
                }
            }
        }
        debug(">> lcpInfo (injectLcpl):");
        debug(JSON.stringify(lcpInfo, null, 4));

        debug("Parse publication - END", epubPath);

        // FIXME: Title could be an array instead of a simple string
        // Store publication in db
        const jsonParsedPublication = TAJSON.serialize(r2Publication);
        const b64ParsedPublication = Buffer
            .from(JSON.stringify(jsonParsedPublication))
            .toString("base64");
        const newPublicationDocument: PublicationDocument = Object.assign(
            {},
            publicationDocument,
            {
                hash: await extractCrc32OnZip(epubPath),
                resources: {
                    filePublication: b64ParsedPublication,
                    opdsPublication: publicationDocument.resources.opdsPublication,
                },
                lcp: lcpInfo,
            },
        );
        return this.publicationRepository.save(newPublicationDocument);
    }

    // public async registerPublicationLicense(
    //     publicationDocument: PublicationDocument,
    // ): Promise<PublicationDocument> {
    //     // Get lsd status
    //     let lsdStatus = await this.getLsdStatus(publicationDocument);
    //     if (lsdStatus.isFailure) {
    //         throw new Error(`Http getLsdStatus error with code
    //             ${lsdStatus.statusCode} for ${lsdStatus.url}`);
    //     }
    //     let newPublicationDocument = await this.updateLsdStatus(
    //         publicationDocument,
    //         lsdStatus.data,
    //     );
    //     if (newPublicationDocument.isFailure) {
    //         throw new Error(`Http updateLsdStatus error with code
    //             ${newPublicationDocument.statusCode} for ${newPublicationDocument.url}`);
    //     }

    //     // Renew
    //     await lsdRegister(
    //         lsdStatus.data,
    //         this.deviceIdManager,
    //     );

    //     // Update again lsd status
    //     lsdStatus = await this.getLsdStatus(newPublicationDocument.data);
    //     if (lsdStatus.isFailure) {
    //         throw new Error(`Http getLsdStatus error with code
    //             ${lsdStatus.statusCode} for ${lsdStatus.url}`);
    //     }
    //     newPublicationDocument = await this.updateLsdStatus(
    //         publicationDocument,
    //         lsdStatus.data,
    //     );
    //     if (newPublicationDocument.isFailure) {
    //         throw new Error(`Http updateLsdStatus error with code
    //             ${newPublicationDocument.statusCode} for ${newPublicationDocument.url}`);
    //     }

    //     return await this.publicationRepository.get(publicationDocument.identifier);
    // }

    // public async renewPublicationLicense(
    //     publicationDocument: PublicationDocument,
    // ): Promise<PublicationDocument> {
    //     // Update lsd status
    //     let lsdStatus = await this.getLsdStatus(publicationDocument);
    //     if (lsdStatus.isFailure) {
    //         throw new Error(`Http getLsdStatus error with code
    //             ${lsdStatus.statusCode} for ${lsdStatus.url}`);
    //     }
    //     let newPublicationDocument = await this.updateLsdStatus(
    //         publicationDocument,
    //         lsdStatus.data,
    //     );
    //     if (newPublicationDocument.isFailure) {
    //         throw new Error(`Http updateLsdStatus error with code
    //             ${newPublicationDocument.statusCode} for ${newPublicationDocument.url}`);
    //     }
    //     // Renew
    //     await lsdRenew(
    //         undefined,
    //         lsdStatus.data,
    //         this.deviceIdManager,
    //     );

    //     // Update again lsd status
    //     lsdStatus = await this.getLsdStatus(newPublicationDocument.data);
    //     if (lsdStatus.isFailure) {
    //         throw new Error(`Http getLsdStatus error with code
    //             ${lsdStatus.statusCode} for ${lsdStatus.url}`);
    //     }
    //     newPublicationDocument = await this.updateLsdStatus(
    //         publicationDocument,
    //         lsdStatus.data,
    //     );
    //     if (newPublicationDocument.isFailure) {
    //         throw new Error(`Http getLsdStatus error with code
    //             ${newPublicationDocument.statusCode} for ${newPublicationDocument.url}`);
    //     }
    //     return await this.publicationRepository.get(publicationDocument.identifier);
    // }

    // public async returnPublicationLicense(
    //     publicationDocument: PublicationDocument,
    // ): Promise<PublicationDocument> {
    //     // Update lsd status
    //     let lsdStatus = await this.getLsdStatus(publicationDocument);
    //     if (lsdStatus.isFailure) {
    //         throw new Error(`Http getLsdStatus error with code
    //             ${lsdStatus.statusCode} for ${lsdStatus.url}`);
    //     }
    //     let newPublicationDocument = await this.updateLsdStatus(
    //         publicationDocument,
    //         lsdStatus.data,
    //     );
    //     if (newPublicationDocument.isFailure) {
    //         throw new Error(`Http getLsdStatus error with code
    //             ${newPublicationDocument.statusCode} for ${newPublicationDocument.url}`);
    //     }
    //     // Renew
    //     await lsdReturn(
    //         lsdStatus,
    //         this.deviceIdManager,
    //     );

    //     // Update again lsd status
    //     lsdStatus = await this.getLsdStatus(newPublicationDocument.data);
    //     if (lsdStatus.isFailure) {
    //         throw new Error(`Http getLsdStatus error with code
    //             ${lsdStatus.statusCode} for ${lsdStatus.url}`);
    //     }
    //     newPublicationDocument = await this.updateLsdStatus(
    //         publicationDocument,
    //         lsdStatus.data,
    //     );
    //     if (newPublicationDocument.isFailure) {
    //         throw new Error(`Http updateLsdStatus error with code
    //             ${newPublicationDocument.statusCode} for ${newPublicationDocument.url}`);
    //     }
    //     return await this.publicationRepository.get(publicationDocument.identifier);
    // }

    // public async getLsdStatus(publicationDocument: PublicationDocument): Promise<IHttpGetResult<string, any>> {
    //     // Get lsd status
    //     const lsdStatusBodyResponse = await httpGet<string, any>(
    //         publicationDocument.lcp.lsd.statusUrl,
    //         {
    //             json: true,
    //         },
    //     );
    //     return lsdStatusBodyResponse;
    // }

    // public async updateLsdStatus(
    //     publicationDocument: PublicationDocument,
    //     lsdStatus: any,
    // ): Promise<THttpGetPublicationDocument> {
    //     // Search LCPL license url
    //     let lcplUrl: string = null;

    //     for (const link of lsdStatus.links) {
    //         if (link.rel === "license") {
    //             // This is the lsd status url link
    //             lcplUrl = link.href;
    //             break;
    //         }
    //     }

    //     if (!lcplUrl) {
    //         throw new Error("No lcpl file");
    //     }

    //     // Download and inject new lcpl file
    //     return await httpGet(lcplUrl, {}, async (lcplResponse) => {
    //         if (lcplResponse.isFailure) {
    //             return lcplResponse;
    //         }
    //         const lcpl = JSON.parse(lcplResponse.body);
    //         let newPublicationDocument = await this.injectLcpl(
    //             publicationDocument,
    //             lcpl,
    //         );

    //         // Update status document
    //         const updatedLicense = await this.processStatusDocument(
    //             newPublicationDocument,
    //         );

    //         if (updatedLicense) {
    //             newPublicationDocument = await this.injectLcpl(
    //                 newPublicationDocument,
    //                 updatedLicense,
    //             );
    //         }

    //         lcplResponse.data = newPublicationDocument;
    //         return lcplResponse;
    //     });
    // }

    // private async processStatusDocument(
    //     publicationDocument: PublicationDocument,
    // ): Promise<PublicationDocument> {
    //     // Get lcpl information
    //     const epubPath = this.publicationStorage.getPublicationEpubPath(
    //         publicationDocument.identifier,
    //     );
    //     const r2Publication: Epub = await EpubParsePromise(epubPath);

    //     return new Promise(async (resolve: any, reject: any) => {
    //         try {
    //             await launchStatusDocumentProcessing(
    //                 r2Publication.LCP,
    //                 this.deviceIdManager,
    //                 async (licenseUpdateJson: string | undefined) => {
    //                     debug("launchStatusDocumentProcessing DONE.");
    //                     debug("new license", licenseUpdateJson);
    //                     resolve(licenseUpdateJson);
    //                 },
    //             );
    //             console.log("status document processed");
    //         } catch (err) {
    //             debug(err);
    //             reject(err);
    //         }
    //     });
    // }

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
                    message = "INCORRECT PASSPHRASE: " + val;
                    break;
                }
                case 11: {
                    message = "LICENSE_OUT_OF_DATE: " + val;
                    break;
                }
                case 101: {
                    message = "CERTIFICATE_REVOKED: " + val;
                    break;
                }
                case 102: {
                    message = "CERTIFICATE_SIGNATURE_INVALID: " + val;
                    break;
                }
                case 111: {
                    message = "LICENSE_SIGNATURE_DATE_INVALID: " + val;
                    break;
                }
                case 112: {
                    message = "LICENSE_SIGNATURE_INVALID: " + val;
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
                    message = "USER_KEY_CHECK_INVALID: " + val;
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

    public async unlockPublication(publication: Publication, passphrase: string | undefined):
        Promise<string | number | null | undefined> {

        // const publicationDocument = await this.publicationRepository.get(publication.identifier);
        // const lsdStatus = await this.getLsdStatus(publicationDocument);
        // if (lsdStatus.isFailure) {
        //     throw new Error(`Http getLsdStatus error with code
        //         ${lsdStatus.statusCode} for ${lsdStatus.url}`);
        // }

        // if (
        //     lsdStatus.data.status !== "ready" &&
        //     lsdStatus.data.status !== "active"
        // ) {
        //     await this.updateLsdStatus(publicationDocument, lsdStatus);
        //     throw new Error("license is not active");
        // }

        const lcpSecretDocs = await this.lcpSecretRepository.findByPublicationIdentifier(
            publication.identifier,
        );
        const secrets = lcpSecretDocs.map((doc: any) => doc.secret).filter((secret) => secret);

        let lcpPasses: string[] | undefined;
        let passphraseHash: string | undefined;
        if (passphrase) {
            passphraseHash = toSha256Hex(passphrase);
            lcpPasses = [passphraseHash];
        } else {
            if (!secrets || !secrets.length) {
                return null;
            }
            lcpPasses = secrets;
        }

        // Get epub file from publication
        const epubPath = this.publicationStorage.getPublicationEpubPath(publication.identifier);
        const r2Publication = await this.streamer.loadOrGetCachedPublication(epubPath);
        if (!r2Publication) {
            debug("unlockPublication !r2Publication ?");
            return null;
        }
        if (!r2Publication.LCP) {
            debug("unlockPublication !r2Publication.LCP ?");
            return null;
        }
        try {
            await doTryLcpPass(
                this.streamer,
                epubPath,
                lcpPasses,
                true, // isSha256Hex
            );
            debug("LCP pass okay");
            if (passphraseHash) {
                if (!secrets.includes(passphraseHash)) {
                    await this.lcpSecretRepository.save({
                        publicationIdentifier: publication.identifier,
                        secret: passphraseHash,
                    });
                }
            }
        } catch (err) {
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

            return err;
        }

        // Register device
        // await this.registerPublicationLicense(publicationDocument);

        return undefined;
    }

    // public async unlockPublicationWithPassphrase(publication: Publication, passphrase: string): Promise<void> {
    //     // const publicationDocument = await this.publicationRepository.get(publication.identifier);
    //     // const lsdStatus = await this.getLsdStatus(publicationDocument);
    //     // if (lsdStatus.isFailure) {
    //     //     throw new Error(`Http getLsdStatus error with code
    //     //         ${lsdStatus.statusCode} for ${lsdStatus.url}`);
    //     // }

    //     // if (
    //     //     lsdStatus.data.status !== "ready" &&
    //     //     lsdStatus.data.status !== "active"
    //     // ) {
    //     //     await this.updateLsdStatus(publicationDocument, lsdStatus);
    //     //     throw new Error("license is not active");
    //     // }

    //     // Get epub file from publication
    //     const epubPath = this.publicationStorage.getPublicationEpubPath(publication.identifier);

    //     // Create sha256 in hex of passphrase
    //     const secret = toSha256Hex(passphrase);
    //     await doTryLcpPass(
    //         this.streamer,
    //         epubPath,
    //         [secret],
    //         true,
    //     );

    //     // If secret is new store it
    //     const lcpSecretDocs = await this.lcpSecretRepository.findByPublicationIdentifier(
    //         publication.identifier,
    //     );
    //     const secrets = lcpSecretDocs.map((doc: any) => doc.secret);

    //     if (!secrets.includes(secret)) {
    //         await this.lcpSecretRepository.save({
    //             publicationIdentifier: publication.identifier,
    //             secret,
    //         });
    //     }

    //     // // Register device
    //     // await this.registerPublicationLicense(publicationDocument);
    // }

    // public async storePassphrase(publication: Publication, passphrase: string): Promise<void> {
    //     // Create sha256 in hex of passphrase
    //     const secret = toSha256Hex(passphrase);
    //     const lcpSecretDoc = {
    //         identifier: uuid.v4(),
    //         publicationIdentifier: publication.identifier,
    //         secret,
    //     } as LcpSecretDocument;

    //     await this.lcpSecretRepository.save(lcpSecretDoc);
    // }
}
