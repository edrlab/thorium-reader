// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { inject, injectable} from "inversify";

import { CatalogEntryView, CatalogView } from "readium-desktop/common/views/catalog";

import { Translator } from "readium-desktop/common/services/translator";

import { CatalogConfig } from "readium-desktop/main/db/document/config";

import { PublicationViewConverter } from "readium-desktop/main/converter/publication";

import { ConfigRepository } from "readium-desktop/main/db/repository/config";
import { PublicationRepository } from "readium-desktop/main/db/repository/publication";

export const CATALOG_CONFIG_ID = "catalog";

@injectable()
export class CatalogApi {
    private publicationRepository: PublicationRepository;
    private configRepository: ConfigRepository;
    private publicationViewConverter: PublicationViewConverter;
    private translator: Translator;

    constructor(
        @inject("publication-repository") publicationRepository: PublicationRepository,
        @inject("config-repository") configRepository: ConfigRepository,
        @inject("publication-view-converter") publicationViewConverter: PublicationViewConverter,
        @inject("translator") translator: Translator,
    ) {
        this.publicationRepository = publicationRepository;
        this.configRepository = configRepository;
        this.publicationViewConverter = publicationViewConverter;
        this.translator = translator;
    }

    public async get(): Promise<CatalogView> {
        const __ = this.translator.translate.bind(this.translator);
        const publications = await this.publicationRepository.findAll();
        const publicationViews = publications.map((doc) => {
            return this.publicationViewConverter.convertDocumentToView(doc);
        });

        // Dynamic entries
        let entries: CatalogEntryView[] = [
            {
                title: __("catalog.entry.lastAdditions"),
                totalCount: publicationViews.length,
                publications: publicationViews,
            },
        ];

        // Concat user entries
        const userEntries = await this.getEntries();
        entries = entries.concat(userEntries);

        return {
            entries,
        };
    }

    public async addEntry(data: any): Promise<CatalogEntryView[]> {
        const entryView = data.entry as CatalogEntryView;
        let entries: any = [];

        try {
            const config = await this.configRepository.get(CATALOG_CONFIG_ID);
            const catalog = config.value as CatalogConfig;
            entries = catalog.entries;
        } catch (error) {
            // New configuration
        }

        entries.push({
            title: entryView.title,
            tag: entryView.tag,
        });

        await this.configRepository.save({
            identifier: CATALOG_CONFIG_ID,
            value: { entries },
        });
        return this.getEntries();
    }

    /**
     * Returns entries without publications
     */
    public async getEntries(): Promise<CatalogEntryView[]> {
        let config = null;

        try {
            config = await this.configRepository.get(CATALOG_CONFIG_ID);
        } catch (error) {
            return [];
        }

        const catalog = config.value as CatalogConfig;
        const entryViews: CatalogEntryView[] = [];

        for (const entry of catalog.entries) {
            const publications = await this.publicationRepository.findByTag(entry.tag);
            const publicationViews = publications.map((doc) => {
                return this.publicationViewConverter.convertDocumentToView(doc);
            });
            entryViews.push(
                {
                    title: entry.title,
                    tag: entry.tag,
                    publications: publicationViews,
                    totalCount: publicationViews.length,
                },
            );
        }

        return entryViews;
    }

    public async updateEntries(data: any): Promise<CatalogEntryView[]> {
        const entryViews = data.entries as CatalogEntryView[];
        const entries = entryViews.map((view) => {
            return {
                title: view.title,
                tag: view.tag,
            };
        });
        const catalogConfig: CatalogConfig = {
            entries,
        };
        await this.configRepository.save({
            identifier: CATALOG_CONFIG_ID,
            value: catalogConfig,
        });
        return this.getEntries();
    }
}
