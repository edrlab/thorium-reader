// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import * as fs from "fs";
import { inject, injectable } from "inversify";
import * as moment from "moment";
import { LcpInfo, LsdStatus } from "readium-desktop/common/models/lcp";
import { ToastType } from "readium-desktop/common/models/toast";
import { readerActions, toastActions } from "readium-desktop/common/redux/actions/";
import { Translator } from "readium-desktop/common/services/translator";
import {
    PublicationDocument, PublicationDocumentWithoutTimestampable,
} from "readium-desktop/main/db/document/publication";
import { LcpSecretRepository } from "readium-desktop/main/db/repository/lcp-secret";
import { PublicationRepository } from "readium-desktop/main/db/repository/publication";
import { diSymbolTable } from "readium-desktop/main/diSymbolTable";
import { RootState } from "readium-desktop/main/redux/states";
import { PublicationStorage } from "readium-desktop/main/storage/publication-storage";
import { toSha256Hex } from "readium-desktop/utils/lcp";
import { Store } from "redux";

import { lsdRenew_ } from "@r2-lcp-js/lsd/renew";
import { lsdReturn_ } from "@r2-lcp-js/lsd/return";
import { launchStatusDocumentProcessing } from "@r2-lcp-js/lsd/status-document-processing";
import { LCP } from "@r2-lcp-js/parser/epub/lcp";
import { LSD } from "@r2-lcp-js/parser/epub/lsd";
import { TaJsonDeserialize, TaJsonSerialize } from "@r2-lcp-js/serializable";
import { doTryLcpPass } from "@r2-navigator-js/electron/main/lcp";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";
import { EpubParsePromise } from "@r2-shared-js/parser/epub";
import { Server } from "@r2-streamer-js/http/server";
import { injectBufferInZip } from "@r2-utils-js/_utils/zip/zipInjector";

import { extractCrc32OnZip } from "../crc";
import { DeviceIdManager } from "./device";

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

    @inject(diSymbolTable["device-id-manager"])
    private readonly deviceIdManager!: DeviceIdManager;

    @inject(diSymbolTable.store)
    private readonly store!: Store<RootState>;

    @inject(diSymbolTable.translator)
    private readonly translator!: Translator;

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

        const jsonSource = lcp.JsonSource ? lcp.JsonSource : JSON.stringify(TaJsonSerialize(lcp));

        const epubPathTMP = epubPath + ".tmplcpl";
        await new Promise((resolve, reject) => {
            injectBufferInZip(
                epubPath,
                epubPathTMP,
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

        // Replace epub without LCP with a new one containing LCPL
        fs.unlinkSync(epubPath);
        await new Promise((resolve, _reject) => {
            setTimeout(() => {
                resolve();
            }, 200); // to avoid issues with some filesystems (allow extra completion time)
        });
        fs.renameSync(epubPathTMP, epubPath);
        await new Promise((resolve, _reject) => {
            setTimeout(() => {
                resolve();
            }, 200); // to avoid issues with some filesystems (allow extra completion time)
        });

        const r2Publication = await this.unmarshallR2Publication(publicationDocument, false);
        r2Publication.LCP = lcp;

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
        }

        const newPublicationDocument: PublicationDocument = Object.assign(
            {},
            publicationDocument,
            {
                hash: await extractCrc32OnZip(epubPath),
            },
        );
        this.updateDocumentLcpLsdBase64Resources(newPublicationDocument, r2Publication.LCP);

        return this.publicationRepository.save(newPublicationDocument);
    }

    public updateDocumentLcpLsdBase64Resources(
        publicationDocument: PublicationDocument | PublicationDocumentWithoutTimestampable,
        r2Lcp: LCP,
    ) {
        if (!publicationDocument.resources) {
            publicationDocument.resources = {};
        }
        if (r2Lcp) {
            const r2LCPStr = r2Lcp.JsonSource ?? JSON.stringify(TaJsonSerialize(r2Lcp));
            publicationDocument.resources.r2LCPBase64 = Buffer.from(r2LCPStr).toString("base64");

            if (r2Lcp.LSD) {
                const r2LSDJson = TaJsonSerialize(r2Lcp.LSD);
                const r2LSDStr = JSON.stringify(r2LSDJson);
                publicationDocument.resources.r2LSDBase64 = Buffer.from(r2LSDStr).toString("base64");
            }

            publicationDocument.lcp = this.convertLcpLsdInfo(
                r2Lcp,
                publicationDocument.resources.r2LCPBase64,
                publicationDocument.resources.r2LSDBase64);
        }
    }

    public async unmarshallR2Publication(
        publicationDocument: PublicationDocument,
        requiresLCP: boolean,
    ): Promise<R2Publication> {

        let r2Publication: R2Publication;

        const mustParse = !publicationDocument.resources ||
            !publicationDocument.resources.r2PublicationBase64 ||
            (requiresLCP && !publicationDocument.resources.r2LCPBase64);

        if (mustParse) {
            const epubPath = this.publicationStorage.getPublicationEpubPath(
                publicationDocument.identifier,
            );

            r2Publication = await EpubParsePromise(epubPath);
            // just like when calling lsdLcpUpdateInject():
            // r2Publication.LCP.ZipPath is set to META-INF/license.lcpl
            // r2Publication.LCP.init(); is called to prepare for decryption (native NodeJS plugin)
            // r2Publication.LCP.JsonSource is set

            // after EpubParsePromise, cleanup zip handler
            // (no need to fetch ZIP data beyond this point)
            r2Publication.freeDestroy();
        } else {
            const r2PublicationBase64 = publicationDocument.resources.r2PublicationBase64;
            const r2PublicationStr = Buffer.from(r2PublicationBase64, "base64").toString("utf-8");
            const r2PublicationJson = JSON.parse(r2PublicationStr);
            r2Publication = TaJsonDeserialize<R2Publication>(r2PublicationJson, R2Publication);
        }
        if (!r2Publication.LCP &&
            publicationDocument.resources && publicationDocument.resources.r2LCPBase64) {

            const r2LCPBase64 = publicationDocument.resources.r2LCPBase64;
            const r2LCPStr = Buffer.from(r2LCPBase64, "base64").toString("utf-8");
            const r2LCPJson = JSON.parse(r2LCPStr);
            const r2LCP = TaJsonDeserialize<LCP>(r2LCPJson, LCP);
            r2LCP.JsonSource = r2LCPStr;

            r2Publication.LCP = r2LCP;
        }
        if (r2Publication.LCP &&
            publicationDocument.resources && publicationDocument.resources.r2LSDBase64) {

            const r2LSDBase64 = publicationDocument.resources.r2LSDBase64;
            const r2LSDStr = Buffer.from(r2LSDBase64, "base64").toString("utf-8");
            const r2LSDJson = JSON.parse(r2LSDStr);
            const r2LSD = TaJsonDeserialize<LSD>(r2LSDJson, LSD);

            r2Publication.LCP.LSD = r2LSD;
        }

        return r2Publication;
    }

    public async checkPublicationLicenseUpdate(
        publicationDocument: PublicationDocument,
    ): Promise<PublicationDocument> {
        const r2Publication = await this.unmarshallR2Publication(publicationDocument, true);
        return await this.checkPublicationLicenseUpdate_(publicationDocument, r2Publication);
    }

    public async checkPublicationLicenseUpdate_(
        publicationDocument: PublicationDocument,
        r2Publication: R2Publication,
    ): Promise<PublicationDocument> {

        let redoHash = false;
        if (r2Publication.LCP) {
            this.store.dispatch(readerActions.closeRequestFromPublication.build(publicationDocument.identifier));
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

        const newPublicationDocument: PublicationDocument = Object.assign(
            {},
            publicationDocument,
            {
                hash: redoHash ? await extractCrc32OnZip(epubPath) : publicationDocument.hash,
            },
        );
        this.updateDocumentLcpLsdBase64Resources(newPublicationDocument, r2Publication.LCP);

        const newPubDocument = await this.publicationRepository.save(newPublicationDocument);
        return Promise.resolve(newPubDocument);
    }

    public async renewPublicationLicense(
        publicationDocument: PublicationDocument,
    ): Promise<PublicationDocument> {

        const locale = this.store.getState().i18n.locale;
        const httpHeaders = {
            "Accept-Language": `${locale},en-US;q=0.7,en;q=0.5`,
            "User-Agent": "readium-desktop",
        };

        const r2Publication = await this.unmarshallR2Publication(publicationDocument, true);

        let newPubDocument = await this.checkPublicationLicenseUpdate_(publicationDocument, r2Publication);

        let redoHash = false;
        if (r2Publication.LCP && r2Publication.LCP.LSD) {
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
                renewResponseLsd = await lsdRenew_(endDate, r2Publication.LCP.LSD, this.deviceIdManager, httpHeaders);
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
                    debug(err);
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
                const newPublicationDocument = Object.assign(
                    {},
                    publicationDocument,
                    {
                        hash: redoHash ? await extractCrc32OnZip(epubPath) : publicationDocument.hash,
                    },
                );
                this.updateDocumentLcpLsdBase64Resources(newPublicationDocument, r2Publication.LCP);

                newPubDocument = await this.publicationRepository.save(newPublicationDocument);
            }
        }

        return Promise.resolve(newPubDocument);
    }

    public async returnPublication(
        publicationDocument: PublicationDocument,
    ): Promise<PublicationDocument> {

        const locale = this.store.getState().i18n.locale;
        const httpHeaders = {
            "Accept-Language": `${locale},en-US;q=0.7,en;q=0.5`,
            "User-Agent": "readium-desktop",
        };

        const r2Publication = await this.unmarshallR2Publication(publicationDocument, true);

        let newPubDocument = await this.checkPublicationLicenseUpdate_(publicationDocument, r2Publication);

        let redoHash = false;
        if (r2Publication.LCP && r2Publication.LCP.LSD) {
            let returnResponseLsd: LSD;
            try {
                returnResponseLsd = await lsdReturn_(r2Publication.LCP.LSD, this.deviceIdManager, httpHeaders);
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
                const newPublicationDocument = Object.assign(
                    {},
                    publicationDocument,
                    {
                        hash: redoHash ? await extractCrc32OnZip(epubPath) : publicationDocument.hash,
                    },
                );
                this.updateDocumentLcpLsdBase64Resources(newPublicationDocument, r2Publication.LCP);

                newPubDocument = await this.publicationRepository.save(newPublicationDocument);
            }
        }

        return Promise.resolve(newPubDocument);
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

    public async unlockPublication(publicationIdentifier: string, passphrase: string | undefined):
        Promise<string | number | null | undefined> {

        const lcpSecretDocs = await this.lcpSecretRepository.findByPublicationIdentifier(
            publicationIdentifier,
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
        const epubPath = this.publicationStorage.getPublicationEpubPath(publicationIdentifier);
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
                        publicationIdentifier,
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

        return undefined;
    }

    public convertLcpLsdInfo(lcp: LCP, r2LCPBase64: string, r2LSDBase64: string): LcpInfo {

        const lcpInfo: LcpInfo = {
            provider: lcp.Provider,
            issued: lcp.Issued,
            updated: lcp.Updated,
            rights: lcp.Rights ? {
                copy: lcp.Rights.Copy,
                print: lcp.Rights.Print,
                start: lcp.Rights.Start,
                end: lcp.Rights.End,
            } : undefined,
            r2LCPBase64,
        };

        if (lcp.Links) {
            const statusLink = lcp.Links.find((link) => {
                return link.Rel === "status";
            });
            if (statusLink) {
                lcpInfo.lsd = {
                    statusUrl: statusLink.Href,
                    r2LSDBase64,
                };
            }
        }

        if (lcp.LSD && lcpInfo.lsd) {
            lcpInfo.lsd.lsdStatus = {
                id: lcp.LSD.ID,
                status: lcp.LSD.Status,
                message: lcp.LSD.Message,
                updated: {
                    license: lcp.LSD.Updated.License.toISOString(),
                    status: lcp.LSD.Updated.Status.toISOString(),
                },
                events: lcp.LSD.Events ? lcp.LSD.Events.map((ev) => {
                    return {
                        id: ev.ID,
                        name: ev.Name,
                        timeStamp: ev.TimeStamp.toISOString(),
                        type: ev.Type, // r2-lcp-js TypeEnum
                    };
                }) : undefined,
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

        const epubPath = this.publicationStorage.getPublicationEpubPath(
            publicationDocumentIdentifier,
        );
        (r2Publication as any).__LCP_LSD_UPDATE_COUNT = 0;
        return this.processStatusDocument_(epubPath, r2Publication);
    }

    private async processStatusDocument_(
        epubPath: string,
        r2Publication: R2Publication): Promise<void> {

        if (!r2Publication.LCP) {
            return Promise.reject("processStatusDocument NO LCP data!");
        }

        const locale = this.store.getState().i18n.locale;
        const httpHeaders = {
            "Accept-Language": `${locale},en-US;q=0.7,en;q=0.5`,
            "User-Agent": "readium-desktop",
        };

        return new Promise(async (resolve, reject) => {
            const callback = async (licenseUpdateJson: string | undefined) => {
                debug("launchStatusDocumentProcessing DONE.");
                debug(licenseUpdateJson);

                if (licenseUpdateJson) {
                    try {
                        const prevLSD = r2Publication.LCP.LSD;
                        // const epubPath_ = await lsdLcpUpdateInject(
                        //     licenseUpdateJson,
                        //     r2Publication,
                        //     epubPath);

                        const lcplJson = global.JSON.parse(licenseUpdateJson);
                        debug(lcplJson);

                        let r2LCP: LCP;
                        try {
                            r2LCP = TaJsonDeserialize<LCP>(lcplJson, LCP);
                        } catch (erorz) {
                            debug(erorz);
                            reject(erorz);
                            return;
                        }
                        r2LCP.JsonSource = licenseUpdateJson;
                        r2Publication.LCP = r2LCP;

                        // will be updated below via another round of processStatusDocument_()
                        r2Publication.LCP.LSD = prevLSD;

                        const epubPathTMP = epubPath + ".tmplsd";
                        await new Promise((res, rej) => {
                            injectBufferInZip(
                                epubPath,
                                epubPathTMP,
                                Buffer.from(licenseUpdateJson, "utf8"),
                                "META-INF/license.lcpl",
                                (e: any) => {
                                    debug("processStatusDocument - injectBufferInZip ERROR!");
                                    debug(e);
                                    rej(e);
                                },
                                () => {
                                    res();
                                });
                        });

                        // Replace epub without LCP with a new one containing LCPL
                        fs.unlinkSync(epubPath);
                        await new Promise((res, _rej) => {
                            setTimeout(() => {
                                res();
                            }, 200); // to avoid issues with some filesystems (allow extra completion time)
                        });
                        fs.renameSync(epubPathTMP, epubPath);
                        await new Promise((res, _rej) => {
                            setTimeout(() => {
                                res();
                            }, 200); // to avoid issues with some filesystems (allow extra completion time)
                        });

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
                                await this.processStatusDocument_(epubPath, r2Publication);
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
            try {
                await launchStatusDocumentProcessing(
                    r2Publication.LCP,
                    this.deviceIdManager,
                    callback,
                    httpHeaders,
                );
            } catch (err) {
                debug(err);
                reject(err);
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
