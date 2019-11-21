// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { inject, injectable } from "inversify";
import { PromiseAllSettled, PromiseFulfilled } from "readium-desktop/common/utils/promise";
import { PublicationView } from "readium-desktop/common/views/publication";
import { PublicationViewConverter } from "readium-desktop/main/converter/publication";
import { PublicationDocument } from "readium-desktop/main/db/document/publication";
import { PublicationRepository } from "readium-desktop/main/db/repository/publication";
import { diSymbolTable } from "readium-desktop/main/diSymbolTable";
import { CatalogService } from "readium-desktop/main/services/catalog";
import { isArray } from "util";

import { TaJsonDeserialize } from "@r2-lcp-js/serializable";
import { OPDSPublication } from "@r2-opds-js/opds/opds2/opds2-publication";

// import * as debug_ from "debug";

export interface IPublicationApi {
    // in a future possible typing like this to have buildRequestData return type :
    // get: (...a: [string]) => Promise<PublicationView> | void;
    get: (identifier: string) => Promise<PublicationView>;
    delete: (identifier: string) => Promise<void>;
    findAll: () => Promise<PublicationView[]>;
    findByTag: (tag: string) => Promise<PublicationView[]>;
    updateTags: (identifier: string, tags: string[]) => Promise<PublicationView>;
    getAllTags: () => Promise<string[]>;
    importOpdsEntry: (
        entryUrl: string,
        r2OpdsPublicationBase64: string,
        baseUrl: string,
    ) => Promise<PublicationView>;
    import: (filePathArray: string | string[]) => Promise<PublicationView[]>;
    search: (title: string) => Promise<PublicationView[]>;
    exportPublication: (publicationView: PublicationView) => Promise<void>;
}

/**
 * public async get(identifier: string): Promise<PublicationView> {
 */
export type TPublicationApiGet = IPublicationApi["get"];
export type TPublicationApiDelete = IPublicationApi["delete"];
export type TPublicationApiFindAll = IPublicationApi["findAll"];
export type TPublicationApiFindByTag = IPublicationApi["findByTag"];
export type TPublicationApiUpdateTags = IPublicationApi["updateTags"];
export type TPublicationApiGetAllTags = IPublicationApi["getAllTags"];
export type TPublicationApiImportOpdsEntry = IPublicationApi["importOpdsEntry"];
export type TPublicationApiImport = IPublicationApi["import"];
export type TPublicationApiSearch = IPublicationApi["search"];
export type TPublicationApiExportPublication = IPublicationApi["exportPublication"];

export type TPublicationApiGet_result = PublicationView;
export type TPublicationApiDelete_result = void;
export type TPublicationApiFindAll_result = PublicationView[];
export type TPublicationApiFindByTag_result = PublicationView[];
export type TPublicationApiUpdateTags_result = PublicationView;
export type TPublicationApiGetAllTags_result = string[];
export type TPublicationApiImportOpdsEntry_result = PublicationView;
export type TPublicationApiImport_result = PublicationView[];
export type TPublicationApiSearch_result = PublicationView[];
export type TPublicationApiExportPublication_result = void;

export interface IPublicationModuleApi {
    "publication/get": TPublicationApiGet;
    "publication/delete": TPublicationApiDelete;
    "publication/findAll": TPublicationApiFindAll;
    "publication/findByTag": TPublicationApiFindByTag;
    "publication/updateTags": TPublicationApiUpdateTags;
    "publication/getAllTags": TPublicationApiGetAllTags;
    "publication/importOpdsEntry": TPublicationApiImportOpdsEntry;
    "publication/import": TPublicationApiImport;
    "publication/search": TPublicationApiSearch;
    "publication/exportPublication": TPublicationApiExportPublication;
}

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

    public async get(identifier: string): Promise<PublicationView> {
        const doc = await this.publicationRepository.get(identifier);
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
        return this.get(identifier);
    }

    /**
     * List all tags defined in all pubs
     *
     */
    public async getAllTags(): Promise<string[]> {
        return this.publicationRepository.getAllTags();
    }

    public async importOpdsEntry(
        entryUrl: string | undefined,
        r2OpdsPublicationBase64: string,
        baseUrl: string,
    ): Promise<PublicationView> {

        let returnView: PublicationView;
        if (entryUrl) {
            // tslint:disable-next-line: max-line-length
            const httpPub = await this.catalogService.importPublicationFromOpdsUrl(entryUrl);
            if (httpPub.isSuccess) {
                returnView = this.publicationViewConverter.convertDocumentToView(httpPub.data);
            } else {
                throw new Error(`Http importPublicationFromOpdsUrl error with code ${httpPub.statusCode} for ${httpPub.url}`);
            }
        } else {
            const r2OpdsPublicationStr = Buffer.from(r2OpdsPublicationBase64, "base64").toString("utf-8");
            const r2OpdsPublicationJson = JSON.parse(r2OpdsPublicationStr);
            const r2OpdsPublication = TaJsonDeserialize<OPDSPublication>(r2OpdsPublicationJson, OPDSPublication);
            let publicationDocument;
            try {
                // tslint:disable-next-line: max-line-length
                publicationDocument = await this.catalogService.importPublicationFromOpdsDoc(r2OpdsPublication, baseUrl);
            } catch (error) {
                throw new Error(`importPublicationFromOpdsDoc error ${error}`);
            }

            returnView = this.publicationViewConverter.convertDocumentToView(publicationDocument);
        }
        return returnView;
    }

    public async import(filePathArray: string | string[]): Promise<PublicationView[]> {

        if (!isArray(filePathArray)) {
            filePathArray = [filePathArray];
        }

        // tslint:disable-next-line: max-line-length
        const publicationDocumentPromises = filePathArray.map((filePath) => this.catalogService.importEpubOrLcplFile(filePath));
        const publicationDocumentPromisesAll = await PromiseAllSettled(publicationDocumentPromises);

        // https://github.com/microsoft/TypeScript/issues/16069 : no inference type on filter
        // tslint:disable-next-line: max-line-length
        const publicationDocumentPromisesAllResolved = publicationDocumentPromisesAll.filter((publicationDocumentPromise) => {
            return publicationDocumentPromise.status === "fulfilled" && publicationDocumentPromise.value;
        }) as Array<PromiseFulfilled<PublicationDocument>>;
        const publicationViews = publicationDocumentPromisesAllResolved.map((publicationDocumentWrapper) => {
            return this.publicationViewConverter.convertDocumentToView(publicationDocumentWrapper.value);
        });

        return publicationViews;
    }

    public async search(title: string): Promise<PublicationView[]> {
        const publicationDocuments = await this.publicationRepository.searchByTitle(title);
        return publicationDocuments.map((publicationDocument) => {
            return this.publicationViewConverter.convertDocumentToView(publicationDocument);
        });
    }

    public async exportPublication(publicationView: PublicationView): Promise<void> {
        this.catalogService.exportPublication(publicationView);
    }
}
