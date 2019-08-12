// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import * as fs from "fs";
import * as uuid from "uuid";

import { JSON as TAJSON } from "ta-json-x";

import { Server } from "@r2-streamer-js/http/server";

import { inject, injectable } from "inversify";

import { lsdRegister } from "@r2-lcp-js/lsd/register";
import { lsdRenew } from "@r2-lcp-js/lsd/renew";
import { lsdReturn } from "@r2-lcp-js/lsd/return";

import { doTryLcpPass } from "@r2-navigator-js/electron/main/lcp";

import { Publication } from "readium-desktop/common/models/publication";

import { toSha256Hex } from "readium-desktop/utils/lcp";

import { launchStatusDocumentProcessing } from "@r2-lcp-js/lsd/status-document-processing";

import { Publication as Epub } from "@r2-shared-js/models/publication";
import { EpubParsePromise } from "@r2-shared-js/parser/epub";

import { httpGet, IHttpGetResult } from "readium-desktop/common/utils/http";

import { LcpInfo } from "readium-desktop/common/models/lcp";

import { PublicationDocument, THttpGetPublicationDocument } from "readium-desktop/main/db/document/publication";

import { injectDataInZip } from "readium-desktop/utils/zip";

import { PublicationStorage } from "readium-desktop/main/storage/publication-storage";

import { PublicationRepository } from "readium-desktop/main/db/repository/publication";

import { DeviceIdManager } from "./device";

import { LcpSecretRepository } from "readium-desktop/main/db/repository/lcp-secret";
import { LcpSecretDocument } from "../db/document/lcp-secret";

// Logger
const debug = debug_("readium-desktop:main#services/lcp");

@injectable()
export class LcpManager {
    @inject("device-id-manager")
    private readonly deviceIdManager!: DeviceIdManager;

    @inject("publication-storage")
    private readonly publicationStorage!: PublicationStorage;

    @inject("publication-repository")
    private readonly publicationRepository!: PublicationRepository;

    @inject("lcp-secret-repository")
    private readonly lcpSecretRepository!: LcpSecretRepository;

    @inject("streamer")
    private readonly streamer!: Server;

    /**
     * Inject lcpl document in publication
     *
     * @param PublicationDocument Publication document on which we inject the lcpl
     * @param lcpl: Lcpl object
     */
    public async injectLcpl(
        publicationDocument: PublicationDocument,
        lcpl: any,
    ): Promise<PublicationDocument> {
        // Get epub file path
        const epubPath = this.publicationStorage.getPublicationEpubPath(
            publicationDocument.identifier,
        );

        // Inject lcpl in a temporary zip
        debug("Inject LCPL - START", epubPath);
        await injectDataInZip(
                epubPath,
                epubPath + ".lcp",
                JSON.stringify(lcpl),
                "META-INF/license.lcpl",
        );
        debug("Inject LCPL - END", epubPath);

        // Replace epub without LCP with a new one containing LCPL
        fs.unlinkSync(epubPath);
        fs.renameSync(epubPath + ".lcp", epubPath);

        debug("Parse publication - START", epubPath);
        const parsedPublication: Epub = await EpubParsePromise(epubPath);
        let lcpInfo: LcpInfo = null;

        if (parsedPublication.LCP) {
            // Add Lcp info
            lcpInfo = {
                provider: parsedPublication.LCP.Provider,
                issued: parsedPublication.LCP.Issued,
                updated: parsedPublication.LCP.Updated,
                rights: {
                    copy: parsedPublication.LCP.Rights.Copy,
                    print: parsedPublication.LCP.Rights.Print,
                    start: parsedPublication.LCP.Rights.Start,
                    end: parsedPublication.LCP.Rights.End,
                },
            };

            // Search for lsd status url
            for (const link of parsedPublication.LCP.Links) {
                if (link.Rel === "status") {
                    // This is the lsd status url link
                    lcpInfo.lsd = {
                        statusUrl: link.Href,
                    };
                    break;
                }
            }
        }
        debug("Parse publication - END", epubPath);

        // FIXME: Title could be an array instead of a simple string
        // Store publication in db
        const jsonParsedPublication = TAJSON.serialize(parsedPublication);
        const b64ParsedPublication = Buffer
            .from(JSON.stringify(jsonParsedPublication))
            .toString("base64");
        const newPublicationDocument = Object.assign(
            {},
            publicationDocument,
            {
                resources: {
                    filePublication: b64ParsedPublication,
                    opdsPublication: publicationDocument.resources.opdsPublication,
                },
                lcp: lcpInfo,
            },
        );
        return this.publicationRepository.save(newPublicationDocument);
    }

    public async registerPublicationLicense(
        publicationDocument: PublicationDocument,
    ): Promise<PublicationDocument> {
        // Get lsd status
        let lsdStatus = await this.getLsdStatus(publicationDocument);
        if (lsdStatus.statusCode !== 200) {
            throw new Error(`Http getLsdStatus error with code
                ${lsdStatus.statusCode} for ${lsdStatus.url}`);
        }
        let newPublicationDocument = await this.updateLsdStatus(
            publicationDocument,
            lsdStatus,
        );
        if (newPublicationDocument.statusCode !== 200) {
            throw new Error(`Http updateLsdStatus error with code
                ${newPublicationDocument.statusCode} for ${newPublicationDocument.url}`);
        }

        // Renew
        await lsdRegister(
            lsdStatus,
            this.deviceIdManager,
        );

        // Update again lsd status
        lsdStatus = await this.getLsdStatus(newPublicationDocument.data);
        if (lsdStatus.statusCode !== 200) {
            throw new Error(`Http getLsdStatus error with code
                ${lsdStatus.statusCode} for ${lsdStatus.url}`);
        }
        newPublicationDocument = await this.updateLsdStatus(
            publicationDocument,
            lsdStatus.data,
        );
        if (newPublicationDocument.statusCode !== 200) {
            throw new Error(`Http updateLsdStatus error with code
                ${newPublicationDocument.statusCode} for ${newPublicationDocument.url}`);
        }

        return await this.publicationRepository.get(publicationDocument.identifier);
    }

    public async renewPublicationLicense(
        publicationDocument: PublicationDocument,
    ): Promise<PublicationDocument> {
        // Update lsd status
        let lsdStatus = await this.getLsdStatus(publicationDocument);
        if (lsdStatus.statusCode !== 200) {
            throw new Error(`Http getLsdStatus error with code
                ${lsdStatus.statusCode} for ${lsdStatus.url}`);
        }
        let newPublicationDocument = await this.updateLsdStatus(
            publicationDocument,
            lsdStatus,
        );
        if (newPublicationDocument.statusCode !== 200) {
            throw new Error(`Http updateLsdStatus error with code
                ${newPublicationDocument.statusCode} for ${newPublicationDocument.url}`);
        }
        // Renew
        await lsdRenew(
            undefined,
            lsdStatus,
            this.deviceIdManager,
        );

        // Update again lsd status
        lsdStatus = await this.getLsdStatus(newPublicationDocument.data);
        if (lsdStatus.statusCode !== 200) {
            throw new Error(`Http getLsdStatus error with code
                ${lsdStatus.statusCode} for ${lsdStatus.url}`);
        }
        newPublicationDocument = await this.updateLsdStatus(
            publicationDocument,
            lsdStatus,
        );
        if (newPublicationDocument.statusCode !== 200) {
            throw new Error(`Http getLsdStatus error with code
                ${newPublicationDocument.statusCode} for ${newPublicationDocument.url}`);
        }
        return await this.publicationRepository.get(publicationDocument.identifier);
    }

    public async returnPublicationLicense(
        publicationDocument: PublicationDocument,
    ): Promise<PublicationDocument> {
        // Update lsd status
        let lsdStatus = await this.getLsdStatus(publicationDocument);
        if (lsdStatus.statusCode !== 200) {
            throw new Error(`Http getLsdStatus error with code
                ${lsdStatus.statusCode} for ${lsdStatus.url}`);
        }
        let newPublicationDocument = await this.updateLsdStatus(
            publicationDocument,
            lsdStatus,
        );
        if (newPublicationDocument.statusCode !== 200) {
            throw new Error(`Http getLsdStatus error error with code
                ${newPublicationDocument.statusCode} for ${newPublicationDocument.url}`);
        }
        // Renew
        await lsdReturn(
            lsdStatus,
            this.deviceIdManager,
        );

        // Update again lsd status
        lsdStatus = await this.getLsdStatus(newPublicationDocument.data);
        if (lsdStatus.statusCode !== 200) {
            throw new Error(`Http getLsdStatus error error with code
                ${lsdStatus.statusCode} for ${lsdStatus.url}`);
        }
        newPublicationDocument = await this.updateLsdStatus(
            publicationDocument,
            lsdStatus,
        );
        if (newPublicationDocument.statusCode !== 200) {
            throw new Error(`Http updateLsdStatus error with code
                ${newPublicationDocument.statusCode} for ${newPublicationDocument.url}`);
        }
        return await this.publicationRepository.get(publicationDocument.identifier);
    }

    public async getLsdStatus(publicationDocument: PublicationDocument): Promise<IHttpGetResult<string, any>> {
        // Get lsd status
        const lsdStatusBodyResponse = await httpGet<string, any>(
            publicationDocument.lcp.lsd.statusUrl,
        );

        lsdStatusBodyResponse.data = JSON.parse(lsdStatusBodyResponse.body);
        return lsdStatusBodyResponse;
    }

    public async updateLsdStatus(
        publicationDocument: PublicationDocument,
        lsdStatus: any,
    ): Promise<THttpGetPublicationDocument> {
        // Search LCPL license url
        let lcplUrl: string = null;

        for (const link of lsdStatus.links) {
            if (link.rel === "license") {
                // This is the lsd status url link
                lcplUrl = link.href;
                break;
            }
        }

        if (!lcplUrl) {
            throw new Error("No lcpl file");
        }

        // Download and inject new lcpl file
        return await httpGet(lcplUrl, {}, async (lcplResponse) => {
            if (lcplResponse.statusCode !== 200) {
                return lcplResponse;
            }
            const lcpl = JSON.parse(lcplResponse.body);
            let newPublicationDocument = await this.injectLcpl(
                publicationDocument,
                lcpl,
            );

            // Update status document
            const updatedLicense = await this.processStatusDocument(
                newPublicationDocument,
            );

            if (updatedLicense) {
                newPublicationDocument = await this.injectLcpl(
                    newPublicationDocument,
                    updatedLicense,
                );
            }

            lcplResponse.data = newPublicationDocument;
            return lcplResponse;
        });
    }

    public async unlockPublication(publication: Publication): Promise<void> {
        const publicationDocument = await this.publicationRepository.get(publication.identifier);
        const lsdStatus = await this.getLsdStatus(publicationDocument);
        if (lsdStatus.statusCode !== 200) {
            throw new Error(`Http getLsdStatus error with code
                ${lsdStatus.statusCode} for ${lsdStatus.url}`);
        }

        if (
            lsdStatus.data.status !== "ready" &&
            lsdStatus.data.status !== "active"
        ) {
            await this.updateLsdStatus(publicationDocument, lsdStatus);
            throw new Error("license is not active");
        }

        // Try to unlock publication with stored secrets
        const lcpSecretDocs = await this.lcpSecretRepository.findByPublicationIdentifier(
            publication.identifier,
        );
        const secrets = lcpSecretDocs.map((doc: any) => doc.secret);

        // Get epub file from publication
        const epubPath = this.publicationStorage.getPublicationEpubPath(publication.identifier);

        await doTryLcpPass(
            this.streamer,
            epubPath,
            secrets,
            true,
        );

        // Register device
        await this.registerPublicationLicense(publicationDocument);
    }

    public async unlockPublicationWithPassphrase(publication: Publication, passphrase: string): Promise<void> {
        const publicationDocument = await this.publicationRepository.get(publication.identifier);
        const lsdStatus = await this.getLsdStatus(publicationDocument);

        if (
            lsdStatus.status !== "ready" &&
            lsdStatus.status !== "active"
        ) {
            await this.updateLsdStatus(publicationDocument, lsdStatus);
            throw new Error("license is not active");
        }

        // Get epub file from publication
        const epubPath = this.publicationStorage.getPublicationEpubPath(publication.identifier);

        // Create sha256 in hex of passphrase
        const secret = toSha256Hex(passphrase);
        await doTryLcpPass(
            this.streamer,
            epubPath,
            [secret],
            true,
        );

        // If secret is new store it
        const lcpSecretDocs = await this.lcpSecretRepository.findByPublicationIdentifier(
            publication.identifier,
        );
        const secrets = lcpSecretDocs.map((doc: any) => doc.secret);

        if (!secrets.includes(secret)) {
            await this.lcpSecretRepository.save({
                publicationIdentifier: publication.identifier,
                secret,
            });
        }

        // Register device
        await this.registerPublicationLicense(publicationDocument);
    }

    public async storePassphrase(publication: Publication, passphrase: string): Promise<void> {
        // Create sha256 in hex of passphrase
        const secret = toSha256Hex(passphrase);
        const lcpSecretDoc = {
            identifier: uuid.v4(),
            publicationIdentifier: publication.identifier,
            secret,
        } as LcpSecretDocument;

        await this.lcpSecretRepository.save(lcpSecretDoc);
    }

    private async processStatusDocument(
        publicationDocument: PublicationDocument,
    ): Promise<PublicationDocument> {
        // Get lcpl information
        const epubPath = this.publicationStorage.getPublicationEpubPath(
            publicationDocument.identifier,
        );
        const parsedPublication: Epub = await EpubParsePromise(epubPath);

        return new Promise(async (resolve: any, reject: any) => {
            try {
                await launchStatusDocumentProcessing(
                    parsedPublication.LCP,
                    this.deviceIdManager,
                    async (licenseUpdateJson: string | undefined) => {
                        debug("launchStatusDocumentProcessing DONE.");
                        debug("new license", licenseUpdateJson);
                        resolve(licenseUpdateJson);
                    },
                );
                console.log("status document processed");
            } catch (err) {
                debug(err);
                reject(err);
            }
        });
    }
}
