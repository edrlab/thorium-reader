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
import { Publication } from "readium-desktop/common/models/publication";
import { ToastType } from "readium-desktop/common/models/toast";
import { closeReaderFromPublication } from "readium-desktop/common/redux/actions/reader";
import { open } from "readium-desktop/common/redux/actions/toast";
import { Translator } from "readium-desktop/common/services/translator";
import { PublicationViewConverter } from "readium-desktop/main/converter/publication";
import { PublicationDocument } from "readium-desktop/main/db/document/publication";
import { LcpSecretRepository } from "readium-desktop/main/db/repository/lcp-secret";
import { PublicationRepository } from "readium-desktop/main/db/repository/publication";
import { diSymbolTable } from "readium-desktop/main/diSymbolTable";
import { PublicationStorage } from "readium-desktop/main/storage/publication-storage";
import { RootState } from "readium-desktop/renderer/redux/states";
import { toSha256Hex } from "readium-desktop/utils/lcp";
import { Store } from "redux";
import { JSON as TAJSON } from "ta-json-x";

import { lsdRenew_ } from "@r2-lcp-js/lsd/renew";
import { lsdReturn_ } from "@r2-lcp-js/lsd/return";
import { launchStatusDocumentProcessing } from "@r2-lcp-js/lsd/status-document-processing";
import { LCP } from "@r2-lcp-js/parser/epub/lcp";
import { LSD } from "@r2-lcp-js/parser/epub/lsd";
import { doTryLcpPass } from "@r2-navigator-js/electron/main/lcp";
import { lsdLcpUpdateInject } from "@r2-navigator-js/electron/main/lsd-injectlcpl";
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

    @inject(diSymbolTable["publication-view-converter"])
    private readonly publicationViewConverter!: PublicationViewConverter;

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
            lcpInfo = this.convertLcpLsdInfo(r2Publication.LCP);
        }
        debug(">> lcpInfo (injectLcpl):");
        debug(JSON.stringify(lcpInfo, null, 4));

        if (r2Publication.LCP) {
            try {
                await this.processStatusDocument(
                    publicationDocument.identifier,
                    r2Publication,
                );

                debug(r2Publication.LCP);
                debug(r2Publication.LCP.LSD);

                lcpInfo = this.convertLcpLsdInfo(r2Publication.LCP);

                debug(">> lcpInfo + LSD (injectLcpl):");
                debug(JSON.stringify(lcpInfo, null, 4));
            } catch (err) {
                debug(err);
            }

            if ((r2Publication as any).__LCP_LSD_UPDATE_COUNT) {
                debug("processStatusDocument LCP updated.");
            }
        }

        debug("Parse publication - END", epubPath);

        // const jsonParsedPublication = TAJSON.serialize(r2Publication);
        // const b64ParsedPublication = Buffer
        //     .from(JSON.stringify(jsonParsedPublication))
        //     .toString("base64");
        const newPublicationDocument: PublicationDocument = Object.assign(
            {},
            publicationDocument,
            {
                hash: await extractCrc32OnZip(epubPath),
                // resources: {
                //     filePublication: b64ParsedPublication,
                //     opdsPublication: publicationDocument.resources.opdsPublication,
                // },
                lcp: lcpInfo,
            },
        );
        return this.publicationRepository.save(newPublicationDocument);
    }

    public async renewPublicationLicense(
        publicationDocument: PublicationDocument,
    ): Promise<PublicationDocument> {

        const epubPath = this.publicationStorage.getPublicationEpubPath(
            publicationDocument.identifier,
        );
        const r2Publication = await EpubParsePromise(epubPath);

        let lcpInfo: LcpInfo = null;
        if (r2Publication.LCP) {
            lcpInfo = this.convertLcpLsdInfo(r2Publication.LCP);
        }
        debug(">> lcpInfo (renewPublicationLicense):");
        debug(JSON.stringify(lcpInfo, null, 4));

        let redoHash = false;

        if (r2Publication.LCP) {
            const publicationView = this.publicationViewConverter.convertDocumentToView(publicationDocument);
            this.store.dispatch(closeReaderFromPublication(publicationView));
            try {
                await this.processStatusDocument(
                    publicationDocument.identifier,
                    r2Publication,
                );

                debug(r2Publication.LCP);
                debug(r2Publication.LCP.LSD);

                lcpInfo = this.convertLcpLsdInfo(r2Publication.LCP);
                publicationDocument.lcp = lcpInfo;

                debug(">> lcpInfo + LSD (renewPublicationLicense):");
                debug(JSON.stringify(lcpInfo, null, 4));
            } catch (err) {
                debug(err);
            }

            if ((r2Publication as any).__LCP_LSD_UPDATE_COUNT) {
                debug("processStatusDocument LCP updated.");
                redoHash = true;
            }
        }

        let newPublicationDocument: PublicationDocument = Object.assign(
            {},
            publicationDocument,
            {
                hash: redoHash ? await extractCrc32OnZip(epubPath) : publicationDocument.hash,
                lcp: lcpInfo,
            },
        );

        let newPubDocument = await this.publicationRepository.save(newPublicationDocument);

        if (r2Publication.LCP && r2Publication.LCP.LSD) {
            const endDateStr: string | undefined = undefined; // TODO: user input?
            const endDate = endDateStr ? moment(endDateStr).toDate() : undefined;
            let renewResponseLsd: LSD;
            try {
                renewResponseLsd = await lsdRenew_(endDate, r2Publication.LCP.LSD, this.deviceIdManager);
            } catch (err) {
                debug(err);
                const str = this.stringifyLsdError(err);
                this.store.dispatch(open(ToastType.DownloadFailed,
                    `LCP [${this.translator.translate("publication.renewButton")}]: ${str}`,
                    ));
            }
            if (renewResponseLsd) {
                debug(renewResponseLsd);
                r2Publication.LCP.LSD = renewResponseLsd;
                lcpInfo = this.convertLcpLsdInfo(r2Publication.LCP);
                publicationDocument.lcp = lcpInfo;

                redoHash = false;
                try {
                    await this.processStatusDocument(
                        publicationDocument.identifier,
                        r2Publication,
                    );

                    debug(r2Publication.LCP);
                    debug(r2Publication.LCP.LSD);

                    lcpInfo = this.convertLcpLsdInfo(r2Publication.LCP);
                    publicationDocument.lcp = lcpInfo;
                } catch (err) {
                    debug(err);
                }

                if ((r2Publication as any).__LCP_LSD_UPDATE_COUNT) {
                    debug("processStatusDocument LCP updated.");
                    redoHash = true;
                }

                debug(">> lcpInfo + LSD-renew (renewPublicationLicense):");
                debug(JSON.stringify(lcpInfo, null, 4));

                const newEndDate = r2Publication.LCP && r2Publication.LCP.Rights && r2Publication.LCP.Rights.End ?
                    r2Publication.LCP.Rights.End.toISOString() : "";
                this.store.dispatch(open(ToastType.DownloadComplete,
                    `LCP [${this.translator.translate("publication.renewButton")}] ${newEndDate}`,
                    ));

                newPublicationDocument = Object.assign(
                    {},
                    publicationDocument,
                    {
                        hash: redoHash ? await extractCrc32OnZip(epubPath) : publicationDocument.hash,
                        lcp: lcpInfo,
                    },
                );
                newPubDocument = await this.publicationRepository.save(newPublicationDocument);
            }
        }

        return Promise.resolve(newPubDocument);
    }

    public async returnPublication(
        publicationDocument: PublicationDocument,
    ): Promise<PublicationDocument> {

        const epubPath = this.publicationStorage.getPublicationEpubPath(
            publicationDocument.identifier,
        );
        const r2Publication = await EpubParsePromise(epubPath);

        let lcpInfo: LcpInfo = null;
        if (r2Publication.LCP) {
            lcpInfo = this.convertLcpLsdInfo(r2Publication.LCP);
        }
        debug(">> lcpInfo (returnPublicationLicense):");
        debug(JSON.stringify(lcpInfo, null, 4));

        let redoHash = false;

        if (r2Publication.LCP) {
            const publicationView = this.publicationViewConverter.convertDocumentToView(publicationDocument);
            this.store.dispatch(closeReaderFromPublication(publicationView));
            try {
                await this.processStatusDocument(
                    publicationDocument.identifier,
                    r2Publication,
                );

                debug(r2Publication.LCP);
                debug(r2Publication.LCP.LSD);

                lcpInfo = this.convertLcpLsdInfo(r2Publication.LCP);
                publicationDocument.lcp = lcpInfo;

                debug(">> lcpInfo + LSD (returnPublicationLicense):");
                debug(JSON.stringify(lcpInfo, null, 4));
            } catch (err) {
                debug(err);
            }

            if ((r2Publication as any).__LCP_LSD_UPDATE_COUNT) {
                debug("processStatusDocument LCP updated.");
                redoHash = true;
            }
        }

        let newPublicationDocument: PublicationDocument = Object.assign(
            {},
            publicationDocument,
            {
                hash: redoHash ? await extractCrc32OnZip(epubPath) : publicationDocument.hash,
                lcp: lcpInfo,
            },
        );

        let newPubDocument = await this.publicationRepository.save(newPublicationDocument);

        if (r2Publication.LCP && r2Publication.LCP.LSD) {
            let returnResponseLsd: LSD;
            try {
                returnResponseLsd = await lsdReturn_(r2Publication.LCP.LSD, this.deviceIdManager);
            } catch (err) {
                debug(err);
                const str = this.stringifyLsdError(err);
                this.store.dispatch(open(ToastType.DownloadFailed,
                    `LCP [${this.translator.translate("publication.returnButton")}]: ${str}`,
                    ));
            }
            if (returnResponseLsd) {
                debug(returnResponseLsd);
                r2Publication.LCP.LSD = returnResponseLsd;
                lcpInfo = this.convertLcpLsdInfo(r2Publication.LCP);
                publicationDocument.lcp = lcpInfo;

                redoHash = false;
                try {
                    await this.processStatusDocument(
                        publicationDocument.identifier,
                        r2Publication,
                    );

                    debug(r2Publication.LCP);
                    debug(r2Publication.LCP.LSD);

                    lcpInfo = this.convertLcpLsdInfo(r2Publication.LCP);
                    publicationDocument.lcp = lcpInfo;
                } catch (err) {
                    debug(err);
                }

                if ((r2Publication as any).__LCP_LSD_UPDATE_COUNT) {
                    debug("processStatusDocument LCP updated.");
                    redoHash = true;
                }

                debug(">> lcpInfo + LSD-return (returnPublicationLicense):");
                debug(JSON.stringify(lcpInfo, null, 4));

                const newEndDate = r2Publication.LCP && r2Publication.LCP.Rights && r2Publication.LCP.Rights.End ?
                    r2Publication.LCP.Rights.End.toISOString() : "";
                this.store.dispatch(open(ToastType.DownloadComplete,
                    `LCP [${this.translator.translate("publication.returnButton")}] ${newEndDate}`,
                    ));

                newPublicationDocument = Object.assign(
                    {},
                    publicationDocument,
                    {
                        hash: redoHash ? await extractCrc32OnZip(epubPath) : publicationDocument.hash,
                        lcp: lcpInfo,
                    },
                );
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

        return undefined;
    }

    public convertLcpLsdInfo(lcp: LCP): LcpInfo {

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
        };

        if (lcp.Links) {
            const statusLink = lcp.Links.find((link) => {
                return link.Rel === "status";
            });
            if (statusLink) {
                lcpInfo.lsd = {
                    statusUrl: statusLink.Href,
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

        return new Promise(async (resolve, reject) => {
            const callback = async (licenseUpdateJson: string | undefined) => {
                debug("launchStatusDocumentProcessing DONE.");
                debug(licenseUpdateJson);

                if (licenseUpdateJson) {
                    let epubPath_: string;
                    try {
                        epubPath_ = await lsdLcpUpdateInject(
                            licenseUpdateJson,
                            r2Publication,
                            epubPath);
                        debug("EPUB LCP INJECTED: " + epubPath_);

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
