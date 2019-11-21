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
import { JSON as TAJSON } from "ta-json-x";
import { isArray } from "util";

import { OPDSPublication } from "@r2-opds-js/opds/opds2/opds2-publication";
import { IOpdsLinkView, IOpdsPublicationView } from "readium-desktop/common/views/opds";

// import * as debug_ from "debug";

export interface IPublicationApi {
    // get: (...a: [string]) => Promise<PublicationView> | void;
    get: (
        identifier: string,
    ) => Promise<PublicationView>;
    delete: (
        identifier: string,
    ) => Promise<void>;
    findAll: (
    ) => Promise<PublicationView[]>;
    findByTag: (
        tag: string,
    ) => Promise<PublicationView[]>;
    updateTags: (
        identifier: string,
        tags: string[],
    ) => Promise<PublicationView>;
    getAllTags: (
    ) => Promise<string[]>;
    importOpdsPublicationLink: (
        link: IOpdsLinkView,
        r2OpdsPublicationBase64: string,
    ) => Promise<PublicationView>;
    import: (
        filePathArray: string | string[],
    ) => Promise<PublicationView[]>;
    search: (
        title: string,
    ) => Promise<PublicationView[]>;
    exportPublication: (
        publicationView: PublicationView,
    ) => Promise<void>;
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
export type TPublicationApiImportOpdsPublicationLink = IPublicationApi["importOpdsPublicationLink"];
export type TPublicationApiImport = IPublicationApi["import"];
export type TPublicationApiSearch = IPublicationApi["search"];
export type TPublicationApiExportPublication = IPublicationApi["exportPublication"];

export type TPublicationApiGet_result = PublicationView;
export type TPublicationApiDelete_result = void;
export type TPublicationApiFindAll_result = PublicationView[];
export type TPublicationApiFindByTag_result = PublicationView[];
export type TPublicationApiUpdateTags_result = PublicationView;
export type TPublicationApiGetAllTags_result = string[];
export type TPublicationApiImportOpdsPublicationLink_result = PublicationView;
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
    "publication/importOpdsPublicationLink": TPublicationApiImportOpdsPublicationLink;
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

    public async importOpdsPublicationLink(
        link: IOpdsLinkView,
        r2OpdsPublicationBase64: string,
    ): Promise<PublicationView> {
        let returnView: PublicationView;

        if (link && link.url && r2OpdsPublicationBase64) {

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
            (filePath) => this.catalogService.importEpubOrLcplFile(filePath)
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
            this.catalogService.exportPublication(publicationView);
        }
    }
}
