// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { inject, injectable } from "inversify";
import { ToastType } from "readium-desktop/common/models/toast";
import { downloadActions, toastActions } from "readium-desktop/common/redux/actions/";
import { Translator } from "readium-desktop/common/services/translator";
import { PromiseAllSettled, PromiseFulfilled } from "readium-desktop/common/utils/promise";
import { PublicationView } from "readium-desktop/common/views/publication";
import { PublicationViewConverter } from "readium-desktop/main/converter/publication";
import { PublicationDocument } from "readium-desktop/main/db/document/publication";
import { PublicationRepository } from "readium-desktop/main/db/repository/publication";
import { diMainGet } from "readium-desktop/main/di";
import { diSymbolTable } from "readium-desktop/main/diSymbolTable";
import { CatalogService } from "readium-desktop/main/services/catalog";
import { JSON as TAJSON } from "ta-json-x";
import { isArray } from "util";

import { OPDSPublication } from "@r2-opds-js/opds/opds2/opds2-publication";

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
        url: string,
        r2OpdsPublicationBase64: string,
        title: string,
        tags: string[],
        downloadSample?: boolean) => Promise<PublicationView>;
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
const debug = debug_("readium-desktop:main#services/catalog");

@injectable()
export class PublicationApi implements IPublicationApi {
    @inject(diSymbolTable["publication-repository"])
    private readonly publicationRepository!: PublicationRepository;

    @inject(diSymbolTable["publication-view-converter"])
    private readonly publicationViewConverter!: PublicationViewConverter;

    @inject(diSymbolTable["catalog-service"])
    private readonly catalogService!: CatalogService;

    @inject(diSymbolTable.translator)
    private readonly translator!: Translator;

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
        url: string,
        r2OpdsPublicationBase64: string,
        title: string,
        tags?: string[],
        downloadSample = false): Promise<PublicationView> {

        this.sendDownloadRequest(url, title);

        let returnView: PublicationView;
        if (url) {
            const httpPub = await this.catalogService.importPublicationFromOpdsUrl(url, downloadSample, tags);
            if (httpPub.isSuccess) {
                this.sendDownloadSuccess(url, title);
                returnView = this.publicationViewConverter.convertDocumentToView(httpPub.data);
            } else {
                debug(`Http importPublicationFromOpdsUrl error with code ${httpPub.statusCode} for ${httpPub.url}`);
                this.sendDownloadFailure(url, title, `${httpPub.statusCode}`); // throws
            }
        } else {
            const r2OpdsPublicationStr = Buffer.from(r2OpdsPublicationBase64, "base64").toString("utf-8");
            const r2OpdsPublicationJson = JSON.parse(r2OpdsPublicationStr);
            const r2OpdsPublication = TAJSON.deserialize<OPDSPublication>(r2OpdsPublicationJson, OPDSPublication);
            let publicationDocument;
            try {
                // tslint:disable-next-line: max-line-length
                publicationDocument = await this.catalogService.importPublicationFromOpdsDoc(r2OpdsPublication, downloadSample, tags);
            } catch (error) {
                debug(`importOpdsPublication - FAIL`, r2OpdsPublication, error);
                this.sendDownloadFailure(url, title, `${error}`); // throws
            }
            this.sendDownloadSuccess(url, title);
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

    private sendDownloadRequest(url: string, title: string) {
        const store = diMainGet("store");

        store.dispatch(toastActions.openRequest.build(ToastType.Default,
            this.translator.translate("message.download.start", { title })));

        store.dispatch(downloadActions.request.build(url, title));
    }

    private sendDownloadSuccess(url: string, title: string) {
        const store = diMainGet("store");

        store.dispatch(toastActions.openRequest.build(ToastType.Success,
            this.translator.translate("message.download.success", { title })));

        store.dispatch(downloadActions.success.build(url));
    }

    private sendDownloadFailure(url: string, title: string, error: string) {
        const store = diMainGet("store");

        store.dispatch(toastActions.openRequest.build(ToastType.Error,
            this.translator.translate("message.download.error", { title, err: `[${error}]` })));

        store.dispatch(downloadActions.error.build(url));

        throw new Error(error);
    }
}
