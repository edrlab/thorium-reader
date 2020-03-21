// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { inject, injectable } from "inversify";
import { IPublicationApi } from "readium-desktop/common/api/interface/publicationApi.interface";
import { PromiseAllSettled, PromiseFulfilled } from "readium-desktop/common/utils/promise";
import { IOpdsLinkView } from "readium-desktop/common/views/opds";
import { PublicationView } from "readium-desktop/common/views/publication";
import { PublicationViewConverter } from "readium-desktop/main/converter/publication";
import { PublicationDocument } from "readium-desktop/main/db/document/publication";
import { PublicationRepository } from "readium-desktop/main/db/repository/publication";
import { diSymbolTable } from "readium-desktop/main/diSymbolTable";
import { CatalogService } from "readium-desktop/main/services/catalog";
import { LcpManager } from "readium-desktop/main/services/lcp";
import { isArray } from "util";

// import * as debug_ from "debug";
// Logger
// const debug = debug_("readium-desktop:main#services/catalog");

@injectable()
export class PublicationApi implements IPublicationApi {
    @inject(diSymbolTable["publication-repository"])
    private readonly publicationRepository!: PublicationRepository;

    @inject(diSymbolTable["publication-view-converter"])
    private readonly publicationViewConverter!: PublicationViewConverter;

    @inject(diSymbolTable["catalog-service"])
    private readonly catalogService!: CatalogService;

    @inject(diSymbolTable["lcp-manager"])
    private readonly lcpManager!: LcpManager;

    // called for publication info dialog modal box
    public async get(identifier: string, checkLcpLsd: boolean): Promise<PublicationView> {
        let doc = await this.publicationRepository.get(identifier);
        if (checkLcpLsd && doc.lcp) {
            doc = await this.lcpManager.checkPublicationLicenseUpdate(doc);
        }
        return this.publicationViewConverter.convertDocumentToView(doc);
    }

    public async delete(identifier: string): Promise<void> {
        await this.catalogService.deletePublication(identifier);
    }

    public async findAll(): Promise<PublicationView[]> {
        const docs = await this.publicationRepository.findAll();
        return docs.map((doc) => {
            return this.publicationViewConverter.convertDocumentToView(doc);
        });
    }

    public async findByTag(tag: string): Promise<PublicationView[]> {
        const docs = await this.publicationRepository.findByTag(tag);
        return docs.map((doc) => {
            return this.publicationViewConverter.convertDocumentToView(doc);
        });
    }

    public async updateTags(identifier: string, tags: string[]): Promise<PublicationView>  {
        const doc = await this.publicationRepository.get(identifier);
        const newDoc = Object.assign(
            {},
            doc,
            { tags },
        );

        await this.publicationRepository.save(newDoc);
        return this.get(identifier, false);
    }

    /**
     * List all tags defined in all pubs
     *
     */
    public async getAllTags(): Promise<string[]> {
        return this.publicationRepository.getAllTags();
    }

    public async importOpdsPublicationLink(
        link: IOpdsLinkView | undefined,
        r2OpdsPublicationBase64: string | undefined,
    ): Promise<PublicationView> {
        let returnView: PublicationView;

        if (link?.url && r2OpdsPublicationBase64) {

            let publicationDocument;
            try {
                publicationDocument = await this.catalogService.importPublicationFromLink(
                    link,
                    r2OpdsPublicationBase64,
                );

                if (!publicationDocument) {
                    throw new Error("publicationDocument not imported on db");
                }

                returnView = this.publicationViewConverter.convertDocumentToView(publicationDocument);

            } catch (error) {
                throw new Error(`importPublicationFromOpdsDoc error ${error}`);
            }

        }

        return returnView;
    }

    public async import(filePathArray: string | string[]): Promise<PublicationView[]> {

        if (!isArray(filePathArray)) {
            filePathArray = [filePathArray];
        }

        const publicationDocumentPromises = filePathArray.map(
            (filePath) => this.catalogService.importEpubOrLcplFile(filePath),
        );
        const publicationDocumentPromisesAll = await PromiseAllSettled(publicationDocumentPromises);

        // https://github.com/microsoft/TypeScript/issues/16069 : no inference type on filter
        const publicationDocumentPromisesAllResolved = publicationDocumentPromisesAll.filter(
            (publicationDocumentPromise) =>
                publicationDocumentPromise.status === "fulfilled" && publicationDocumentPromise.value,
        ) as Array<PromiseFulfilled<PublicationDocument>>;

        const publicationViews = publicationDocumentPromisesAllResolved.map(
            (publicationDocumentWrapper) =>
                this.publicationViewConverter.convertDocumentToView(publicationDocumentWrapper.value,
        ));

        return publicationViews;
    }

    public async search(title: string): Promise<PublicationView[]> {
        const titleFormated = title?.trim() || "";

        const publicationDocuments = await this.publicationRepository.searchByTitle(titleFormated);

        const publicationViews = publicationDocuments.map((publicationDocument) =>
            this.publicationViewConverter.convertDocumentToView(publicationDocument));

        return publicationViews;
    }

    public async exportPublication(publicationView: PublicationView): Promise<void> {
        if (publicationView) {
            await this.catalogService.exportPublication(publicationView);
        }
    }
}
