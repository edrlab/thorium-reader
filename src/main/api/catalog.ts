// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { inject, injectable } from "inversify";
import { LocatorType } from "readium-desktop/common/models/locator";
import { Translator } from "readium-desktop/common/services/translator";
import { CatalogEntryView, CatalogView } from "readium-desktop/common/views/catalog";
import { PublicationView } from "readium-desktop/common/views/publication";
import { PublicationViewConverter } from "readium-desktop/main/converter/publication";
import {
    CatalogConfig, CatalogEntry, ConfigDocument,
} from "readium-desktop/main/db/document/config";
import { LocatorRepository } from "readium-desktop/main/db/repository/locator";
import { PublicationRepository } from "readium-desktop/main/db/repository/publication";
import { diSymbolTable } from "readium-desktop/main/diSymbolTable";

import { LocatorDocument } from "../db/document/locator";
import { BaseRepository } from "../db/repository/base";

export const CATALOG_CONFIG_ID = "catalog";
type ConfigDocumentType = ConfigDocument<CatalogConfig>;
type ConfigRepositoryType = BaseRepository<ConfigDocumentType>;
// import { Timestampable } from "readium-desktop/common/models/timestampable";
// type ConfigDocumentTypeWithoutTimestampable = Omit<ConfigDocumentType, keyof Timestampable>;

export interface ICatalogApi {
    get: () => Promise<CatalogView>;
    addEntry: (entryView: CatalogEntryView) => Promise<CatalogEntryView[]>;
    getEntries: () => Promise<CatalogEntryView[]>;
    updateEntries: (entryView: CatalogEntryView[]) => Promise<CatalogEntryView[]>;
}

export type TCatalogApiGet = ICatalogApi["get"];
export type TCatalogApiAddEntry = ICatalogApi["addEntry"];
export type TCatalogGetEntries = ICatalogApi["getEntries"];
export type TCatalogUpdateEntries = ICatalogApi["updateEntries"];

export type TCatalogApiGet_result = CatalogView;
export type TCatalogApiAddEntry_result = CatalogEntryView[];
export type TCatalogGetEntries_result = CatalogEntryView[];
export type TCatalogUpdateEntries_result = CatalogEntryView[];

export interface ICatalogModuleApi {
    "catalog/get": TCatalogApiGet;
    "catalog/addEntry": TCatalogApiAddEntry;
    "catalog/getEntries": TCatalogGetEntries;
    "catalog/updateEntries": TCatalogUpdateEntries;
}

@injectable()
export class CatalogApi implements ICatalogApi {
    @inject(diSymbolTable["publication-repository"])
    private readonly publicationRepository!: PublicationRepository;

    @inject(diSymbolTable["config-repository"])
    private readonly configRepository!: ConfigRepositoryType;

    @inject(diSymbolTable["locator-repository"])
    private readonly locatorRepository!: LocatorRepository;

    @inject(diSymbolTable["publication-view-converter"])
    private readonly publicationViewConverter!: PublicationViewConverter;

    @inject(diSymbolTable.translator)
    private readonly translator!: Translator;

    public async get(): Promise<CatalogView> {
        const __ = this.translator.translate.bind(this.translator);

        // Last read publicatons
        const lastLocators = await this.locatorRepository.find(
            {
                selector: { locatorType: LocatorType.LastReadingLocation },
                limit: 10,
                sort: [ { updatedAt: "desc" } ],
            },
        );
        const lastLocatorPublicationIdentifiers = lastLocators.map(
            (locator: LocatorDocument) => locator.publicationIdentifier,
        );
        const lastReadPublicationViews = [];

        for (const pubIdentifier of lastLocatorPublicationIdentifiers) {
            let pubDoc = null;

            try {
                pubDoc = await this.publicationRepository.get(pubIdentifier);
            } catch (error) {
                // Document not found
                continue;
            }

            lastReadPublicationViews.push(
                this.publicationViewConverter.convertDocumentToView(pubDoc),
            );
        }

        // Last added pubs not already on last read list
        const lastAddedPublications = await this.publicationRepository.find({
            limit: 10,
            sort: [ { createdAt: "desc" } ],
            selector: {},
        });
        const lastAddedPublicationViews: PublicationView[] = [];
        for (const doc of lastAddedPublications) {
            if (!lastReadPublicationViews.find((lastDoc) => lastDoc.identifier === doc.identifier)) {
                lastAddedPublicationViews.push(this.publicationViewConverter.convertDocumentToView(doc));
            }
        }

        // Dynamic entries
        let entries: CatalogEntryView[] = [
            {
                title: __("catalog.entry.continueReading"),
                totalCount: lastReadPublicationViews.length,
                publicationViews: lastReadPublicationViews,
            },
            {
                title: __("catalog.entry.lastAdditions"),
                totalCount: lastAddedPublicationViews.length,
                publicationViews: lastAddedPublicationViews,
            },
        ];

        // Concat user entries
        const userEntries = await this.getEntries();
        entries = entries.concat(userEntries);

        return {
            entries,
        };
    }

    public async addEntry(entryView: CatalogEntryView): Promise<CatalogEntryView[]> {
        let entries: CatalogEntry[] = [];

        try {
            const config = await this.configRepository.get(CATALOG_CONFIG_ID);
            const catalog = config.value;
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
     * Returns entries without pubs
     */
    public async getEntries(): Promise<CatalogEntryView[]> {
        let config: ConfigDocumentType;
        try {
            config = await this.configRepository.get(CATALOG_CONFIG_ID);
        } catch (error) {
            return [];
        }

        const catalog = config.value;
        const entryViews: CatalogEntryView[] = [];

        for (const entry of catalog.entries) {
            const publicationDocuments = await this.publicationRepository.findByTag(entry.tag);
            const publicationViews = publicationDocuments.map((doc) => {
                return this.publicationViewConverter.convertDocumentToView(doc);
            });
            entryViews.push(
                {
                    title: entry.title,
                    tag: entry.tag,
                    publicationViews,
                    totalCount: publicationViews.length,
                },
            );
        }

        return entryViews;
    }

    public async updateEntries(entryViews: CatalogEntryView[]): Promise<CatalogEntryView[]> {
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
