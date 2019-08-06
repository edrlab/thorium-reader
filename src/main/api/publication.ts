// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { inject, injectable } from "inversify";

import { PublicationView } from "readium-desktop/common/views/publication";

import { CatalogService } from "readium-desktop/main/services/catalog";

import { PublicationViewConverter } from "readium-desktop/main/converter/publication";

import { PublicationRepository } from "readium-desktop/main/db/repository/publication";

import { container } from "readium-desktop/main/di";

import { Store } from "redux";

import { ToastType } from "readium-desktop/common/models/toast";

import { open } from "readium-desktop/common/redux/actions/toast";

@injectable()
export class PublicationApi {
    @inject("publication-repository")
    private readonly publicationRepository!: PublicationRepository;

    @inject("publication-view-converter")
    private readonly publicationViewConverter!: PublicationViewConverter;

    @inject("catalog-service")
    private readonly catalogService!: CatalogService;

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

    public async importOpdsEntry(data: any): Promise<PublicationView[]> {
        const { url, base64OpdsPublication, downloadSample, title } = data;
        this.dispatchToastRequest(ToastType.DownloadStarted, "message.download.start", title);
        let publication;
        if (url) {
            publication = await this.catalogService.importOpdsEntry(url, downloadSample);
        } else {
            const opdsPublication = JSON.parse(Buffer.from(base64OpdsPublication, "base64").toString("utf-8"));
            publication = await this.catalogService.importOpdsPublication(opdsPublication, downloadSample);
        }
        this.dispatchToastRequest(ToastType.DownloadComplete, "message.download.success", publication.title);
        return null;
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

    private dispatchToastRequest(type: ToastType, message: string, title: string) {
        const store = container.get("store") as Store<any>;
        store.dispatch(open(type,
            {
                message,
                messageProps: {title},
            },
        ));
    }
}
