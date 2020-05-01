// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { inject, injectable } from "inversify";
import * as Ramda from "ramda";
import { ICatalogApi } from "readium-desktop/common/api/interface/catalog.interface";
import { ToastType } from "readium-desktop/common/models/toast";
import { toastActions } from "readium-desktop/common/redux/actions";
import { Translator } from "readium-desktop/common/services/translator";
import { CatalogEntryView, CatalogView } from "readium-desktop/common/views/catalog";
import { PublicationView } from "readium-desktop/common/views/publication";
import { PublicationViewConverter } from "readium-desktop/main/converter/publication";
// import {
//     CatalogConfig, CatalogEntry, ConfigDocument,
// } from "readium-desktop/main/db/document/config";
// import { ConfigRepository } from "readium-desktop/main/db/repository/config";
import { diSymbolTable } from "readium-desktop/main/diSymbolTable";
import { Store } from "redux";

import { PublicationRepository } from "../db/repository/publication";
import { publicationActions } from "../redux/actions";
import { RootState } from "../redux/states";
import { PublicationService } from "../services/publication";

export const CATALOG_CONFIG_ID = "catalog";

// Logger
const debug = debug_("readium-desktop:main:api:catalog");

@injectable()
export class CatalogApi implements ICatalogApi {
    @inject(diSymbolTable["publication-repository"])
    private readonly publicationRepository!: PublicationRepository;

    @inject(diSymbolTable["publication-service"])
    private readonly publicationService!: PublicationService;

    // @inject(diSymbolTable["config-repository"])
    // private readonly configRepository!: ConfigRepository<CatalogConfig>;

    // @inject(diSymbolTable["locator-repository"])
    // private readonly locatorRepository!: LocatorRepository;

    @inject(diSymbolTable["publication-view-converter"])
    private readonly publicationViewConverter!: PublicationViewConverter;

    @inject(diSymbolTable.translator)
    private readonly translator!: Translator;

    @inject(diSymbolTable.store)
    private readonly store!: Store<RootState>;

    public async get(): Promise<CatalogView> {
        const __ = this.translator.translate.bind(this.translator);

        // // Last read publicatons
        // const lastLocators = await this.locatorRepository.find(
        //     {
        //         selector: { locatorType: LocatorType.LastReadingLocation },
        //         limit: 10,
        //         sort: [ { updatedAt: "desc" } ],
        //     },
        // );
        // const lastLocatorPublicationIdentifiers = lastLocators.map(
        //     (locator: LocatorDocument) => locator.publicationIdentifier,
        // );

        // for (const pubIdentifier of lastLocatorPublicationIdentifiers) {
        //     let pubDoc = null;

        //     try {
        //         pubDoc = await this.publicationRepository.get(pubIdentifier);
        //     } catch (error) {
        //         // Document not found
        //         continue;
        //     }

        //     lastReadPublicationViews.push(
        //         this.publicationViewConverter.convertDocumentToView(pubDoc),
        //     );
        // }

        const lastReadPublicationViews: PublicationView[] = [];

        const lastReading = this.store.getState().publication.lastReadingQueue;

        const pushPublication = async (i: number) => {

            if (i < lastReading.length) {
                const [, pubId] = lastReading[i];

                try {
                    const pub = await this.publicationService.getPublication(pubId);
                    lastReadPublicationViews.push(pub);
                } catch (e) {
                    // ignore

                    // TODO toastInfo?

                    // dispatch action to update publication/lastReadingQueue reducer
                    this.store.dispatch(publicationActions.deletePublication.build(pubId));
                }
            }
        };

        await Promise.all(Ramda.times(pushPublication, 10));

        // Last added pubs not already on last read list
        const lastAddedPublications = await this.publicationRepository.find({
            sort: [{ createdAt: "desc" }],
            selector: {},
        });

        const lastAddedPublicationViews: PublicationView[] = [];

        {
            let i = 0;
            while (
                lastAddedPublicationViews.length < 10
                && i < lastAddedPublications.length
            ) {

                const doc = lastAddedPublications[i];
                const notInReading = lastReadPublicationViews.
                    findIndex((lastDoc) => lastDoc.identifier === doc.identifier) < 0;

                if (notInReading) {
                    try {
                        const pub = this.publicationViewConverter.convertDocumentToView(doc);
                        lastAddedPublicationViews.push(pub);
                    } catch (e) {
                        debug("Error in convertDocumentToView doc=", doc);
                        this.store.dispatch(toastActions.openRequest.build(ToastType.Error, doc.title || ""));

                        debug(`${doc.identifier} => ${doc.title} should be removed`);
                        try {
                            // tslint:disable-next-line: no-floating-promises
                            this.publicationService.deletePublication(doc.identifier);
                        } catch {
                            // ignore
                        }
                    }
                }

                ++i;
            }
        }

        const isAudiobook = (item: PublicationView) =>
            item.RDFType && /http[s]?:\/\/schema\.org\/Audiobook$/.test(item.RDFType);

        const lastAddedPublication = lastAddedPublicationViews.filter((item) => !isAudiobook(item));
        const lastReadPublication = lastReadPublicationViews.filter((item) => !isAudiobook(item));
        const lastAddedAudiobooks = lastAddedPublicationViews.filter(isAudiobook);
        const lastReadAudiobooks = lastReadPublicationViews.filter(isAudiobook);

        // Dynamic entries
        const entries: CatalogEntryView[] = [
            {
                title: __("catalog.entry.continueReading"),
                totalCount: lastReadPublication.length,
                publicationViews: lastReadPublication,
            },
            {
                title: __("catalog.entry.lastAdditions"),
                totalCount: lastAddedPublication.length,
                publicationViews: lastAddedPublication,
            },
            {
                title: __("catalog.entry.continueReadingAudioBooks"),
                totalCount: lastReadAudiobooks.length,
                publicationViews: lastReadAudiobooks,
            },
            {
                title: __("catalog.entry.lastAdditionsAudioBooks"),
                totalCount: lastAddedAudiobooks.length,
                publicationViews: lastAddedAudiobooks,
            },
        ];

        // // Concat user entries
        // const userEntries = await this.getEntries();
        // entries = entries.concat(userEntries);

        return {
            entries,
        };
    }

    // public async addEntry(entryView: CatalogEntryView): Promise<CatalogEntryView[]> {
    //     let entries: CatalogEntry[] = [];

    //     try {
    //         const config = await this.configRepository.get(CATALOG_CONFIG_ID);
    //         const catalog = config.value;
    //         entries = catalog.entries;
    //     } catch (error) {
    //         // New configuration
    //     }

    //     entries.push({
    //         title: entryView.title,
    //         tag: entryView.tag,
    //     });

    //     await this.configRepository.save({
    //         identifier: CATALOG_CONFIG_ID,
    //         value: { entries },
    //     });
    //     return this.getEntries();
    // }

    // /**
    //  * Returns entries without pubs
    //  */
    // public async getEntries(): Promise<CatalogEntryView[]> {
    //     let config: ConfigDocument<CatalogConfig>;
    //     try {
    //         config = await this.configRepository.get(CATALOG_CONFIG_ID);
    //     } catch (error) {
    //         return [];
    //     }

    //     const catalog = config.value;
    //     const entryViews: CatalogEntryView[] = [];

    //     for (const entry of catalog.entries) {
    //         const publicationDocuments = await this.publicationRepository.findByTag(entry.tag);
    //         const publicationViews = publicationDocuments.map((doc) => {
    //             return this.publicationViewConverter.convertDocumentToView(doc);
    //         });
    //         entryViews.push(
    //             {
    //                 title: entry.title,
    //                 tag: entry.tag,
    //                 publicationViews,
    //                 totalCount: publicationViews.length,
    //             },
    //         );
    //     }

    //     return entryViews;
    // }

    // public async updateEntries(entryViews: CatalogEntryView[]): Promise<CatalogEntryView[]> {
    //     const entries = entryViews.map((view) => {
    //         return {
    //             title: view.title,
    //             tag: view.tag,
    //         };
    //     });
    //     const catalogConfig: CatalogConfig = {
    //         entries,
    //     };
    //     await this.configRepository.save({
    //         identifier: CATALOG_CONFIG_ID,
    //         value: catalogConfig,
    //     });
    //     return this.getEntries();
    // }
}
