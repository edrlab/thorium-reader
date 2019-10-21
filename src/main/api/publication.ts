// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { inject, injectable } from "inversify";
import { ToastType } from "readium-desktop/common/models/toast";
import { downloadActions } from "readium-desktop/common/redux/actions";
import { open } from "readium-desktop/common/redux/actions/toast";
import { Translator } from "readium-desktop/common/services/translator";
import { PublicationView } from "readium-desktop/common/views/publication";
import { PublicationViewConverter } from "readium-desktop/main/converter/publication";
import { PublicationRepository } from "readium-desktop/main/db/repository/publication";
import { diMainGet } from "readium-desktop/main/di";
import { diSymbolTable } from "readium-desktop/main/diSymbolTable";
import { CatalogService } from "readium-desktop/main/services/catalog";
import { isArray } from "util";

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
        base64OpdsPublication: string,
        title: string,
        tags: string[],
        downloadSample?: boolean) => Promise<PublicationView>;
    import: (filePathArray: string | string[]) => Promise<PublicationView[]>;
    search: (title: string) => Promise<PublicationView[]>;
    exportPublication: (publication: PublicationView) => Promise<void>;
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
     * List all tags defined in all publications
     *
     */
    public async getAllTags(): Promise<string[]> {
        return this.publicationRepository.getAllTags();
    }

    // FIXME : call from this interface ImportOpdsPublication that is cast from OpdsPublicationView.
    // OpdsPublicationView has many undefined that is not reported to this function call.
    // Potential crash to fix
    public async importOpdsEntry(
        url: string,
        base64OpdsPublication: string,
        title: string,
        tags?: string[],
        downloadSample = false): Promise<PublicationView> {

        this.sendDownloadRequest(url);
        // dispatch notification to user with redux
        this.dispatchToastRequest(ToastType.DownloadStarted,
            this.translator.translate("message.download.start", { title }));

        let returnView: PublicationView;
        // if url exist import new entry by download
        if (url) {
            const httpPub = await this.catalogService.importOpdsEntry(url, downloadSample, tags);
            if (httpPub.isSuccess) {
                this.sendDownloadSuccess(url);
                returnView = this.publicationViewConverter.convertDocumentToView(httpPub.data);
            } else {
                // FIXME : Why no dispatchToastRequest here ?
                throw new Error(`Http importOpdsEntry error with code
                    ${httpPub.statusCode} for ${httpPub.url}`);
            }
        } else {
            // FIXME : base64OpdsPublication can be undefined
            const opdsPublication = // OPDSPublication
                JSON.parse(Buffer.from(base64OpdsPublication, "base64").toString("utf-8"));
            let publication;
            try {
                // FIXME : opdsPublication is any and
                // importOpdsPublication first param type is OPDSPublication what is a CLASS ??
                publication = await this.catalogService.importOpdsPublication(opdsPublication, downloadSample, tags);
            } catch (error) {
                debug(`importOpdsPublication - FAIL`, opdsPublication, error);
                this.dispatchToastRequest(ToastType.DownloadFailed, `[${error}]`);
                throw new Error(`importOpdsPublication ${error}`);
            }
            this.sendDownloadSuccess(url);
            returnView = this.publicationViewConverter.convertDocumentToView(publication);
        }
        return returnView;
    }

    public async import(filePathArray: string | string[]): Promise<PublicationView[]> {

        if (!isArray(filePathArray)) {
            filePathArray = [filePathArray];
        }
        // returns all publications linked to this import
        const pubsRawPromise = filePathArray.map((filePath) => this.catalogService.importFile(filePath));
        const pubsRaw = await PromiseAllSettled(pubsRawPromise);
        const pubs = pubsRaw.filter((pub) => pub.status === "fulfilled" && pub.value);
        // https://github.com/microsoft/TypeScript/issues/16069 : no inference type on filter
        const pubsView = pubs.map((pub) => this.publicationViewConverter.convertDocumentToView((pub as any).value));
        return pubsView;
    }

    public async search(title: string): Promise<PublicationView[]> {
        const docs = await this.publicationRepository.searchByTitle(title);
        return docs.map((doc) => {
            return this.publicationViewConverter.convertDocumentToView(doc);
        });
    }

    public async exportPublication(publication: PublicationView): Promise<void> {
        this.catalogService.exportPublication(publication);
    }

    private dispatchToastRequest(type: ToastType, message: string) {
        const store = diMainGet("store");
        store.dispatch(open(type, message));
    }

    private sendDownloadRequest(url: string) {
        const store = diMainGet("store");
        store.dispatch(downloadActions.addDownload(
            {
                url,
            },
        ));
    }

    private sendDownloadSuccess(url: string) {
        const store = diMainGet("store");
        store.dispatch(downloadActions.removeDownload(
            {
                url,
            },
        ));
    }
}
