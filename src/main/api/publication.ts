// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { inject, injectable } from "inversify";
import { ToastType } from "readium-desktop/common/models/toast";
import { open } from "readium-desktop/common/redux/actions/toast";
import { Translator } from "readium-desktop/common/services/translator";
import { PublicationView } from "readium-desktop/common/views/publication";
import { PublicationViewConverter } from "readium-desktop/main/converter/publication";
import { PublicationRepository } from "readium-desktop/main/db/repository/publication";
import { container } from "readium-desktop/main/di";
import { CatalogService } from "readium-desktop/main/services/catalog";
import { Store } from "redux";

@injectable()
export class PublicationApi {
    @inject("publication-repository")
    private readonly publicationRepository!: PublicationRepository;

    @inject("publication-view-converter")
    private readonly publicationViewConverter!: PublicationViewConverter;

    @inject("catalog-service")
    private readonly catalogService!: CatalogService;

    @inject("translator")
    private readonly translator!: Translator;

    public async get(data: any): Promise<PublicationView> {
        const { identifier } = data;
        const doc = await this.publicationRepository.get(identifier);
        return this.publicationViewConverter.convertDocumentToView(doc);
    }

    public async delete(data: any): Promise<void> {
        const { identifier } = data;
        await this.catalogService.deletePublication(identifier);
    }

    public async findAll(): Promise<PublicationView[]> {
        const docs = await this.publicationRepository.findAll();
        return docs.map((doc) => {
            return this.publicationViewConverter.convertDocumentToView(doc);
        });
    }

    public async findByTag(data: any): Promise<PublicationView[]> {
        const { tag } = data;
        const docs = await this.publicationRepository.findByTag(tag);
        return docs.map((doc) => {
            return this.publicationViewConverter.convertDocumentToView(doc);
        });
    }

    public async updateTags(data: any): Promise<PublicationView>  {
        const { identifier, tags } = data;
        const doc = await this.publicationRepository.get(identifier);
        const newDoc = Object.assign(
            {},
            doc,
            { tags },
        );

        await this.publicationRepository.save(newDoc);
        return this.get({ identifier });
    }

    /**
     * List all tags defined in all publications
     *
     */
    public async getAllTags(): Promise<string[]> {
        return this.publicationRepository.getAllTags();
    }

    public async importOpdsEntry(data: any): Promise<PublicationView> {

        // dispatch notification to user with redux
        this.dispatchToastRequest(ToastType.DownloadStarted,
            this.translator.translate("message.download.start", {title: data.title}));

        let returnView: PublicationView;
        let title: string;
        // if url exist import new entry by download
        if (data.url) {
            const httpPub = await this.catalogService.importOpdsEntry(data.url, data.downloadSample);
            if (httpPub.isSuccess) {
                title = httpPub.data.title;
                returnView = this.publicationViewConverter.convertDocumentToView(httpPub.data);
            } else {
                throw new Error(`Http importOpdsEntry error with code
                    ${httpPub.statusCode} for ${httpPub.url}`);
            }
        } else {
            const opdsPublication = JSON.parse(Buffer.from(data.base64OpdsPublication, "base64").toString("utf-8"));
            const publication = await this.catalogService.importOpdsPublication(opdsPublication, data.downloadSample);
            title = publication.title;
            returnView = this.publicationViewConverter.convertDocumentToView(publication);
        }

        // dispatch notification to user with redux
        this.dispatchToastRequest(ToastType.DownloadComplete,
            this.translator.translate("message.download.success", {title}));
        return returnView;
    }

    public async import(data: any): Promise<PublicationView[]> {
        const { paths } = data;

        // returns all publications linked to this import
        const newDocs = [];

        for (const path of paths) {
            const newDoc = await this.catalogService.importFile(path);
            newDocs.push(newDoc);
        }

        return newDocs.map((doc) => {
            const publication = this.publicationViewConverter.convertDocumentToView(doc);
            this.dispatchToastRequest(ToastType.DownloadComplete, "message.import.success", publication.title);
            return publication;
        });
    }

    public async search(data: any): Promise<PublicationView[]> {
        const { text } = data;
        const docs = await this.publicationRepository.searchByTitle(text);
        return docs.map((doc) => {
            return this.publicationViewConverter.convertDocumentToView(doc);
        });
    }

    public async exportPublication(data: any): Promise<void> {
        const { publication, destinationPath } = data;
        this.catalogService.exportPublication(publication, destinationPath);
    }

    private dispatchToastRequest(type: ToastType, message: string) {
        const store = container.get("store") as Store<any>;
        store.dispatch(open(type, message));
    }
}
