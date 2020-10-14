// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { inject, injectable } from "inversify";
import { ICatalogApi } from "readium-desktop/common/api/interface/catalog.interface";
import { isAudiobookFn, isDivinaFn, isPdfFn } from "readium-desktop/common/isManifestType";
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

import { TaJsonDeserialize } from "@r2-lcp-js/serializable";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";

import { PublicationDocument } from "../db/document/publication";
import { PublicationRepository } from "../db/repository/publication";
import { diMainGet } from "../di";
// import { publicationActions } from "../redux/actions";
import { RootState } from "../redux/states";

export const CATALOG_CONFIG_ID = "catalog";

const NB_PUB = 10;

// Logger
const debug = debug_("readium-desktop:main:api:catalog");

interface ICatalogReadedOrAdded {
    readed: PublicationView[];
    added: PublicationView[];
}

interface ICatalogCategories {
    audio: ICatalogReadedOrAdded;
    divina: ICatalogReadedOrAdded;
    epub: ICatalogReadedOrAdded;
    pdf: ICatalogReadedOrAdded;
}

@injectable()
export class CatalogApi implements ICatalogApi {
    @inject(diSymbolTable["publication-repository"])
    private readonly publicationRepository!: PublicationRepository;

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

        const {
            audio: {
                readed: audiobookReaded,
                added: audiobookAdded,
            },
            divina: {
                readed: divinaReaded,
                added: divinaAdded,
            },
            epub: {
                readed: epubReaded,
                added: epubAdded,
            },
            pdf: {
                readed: pdfReaded,
                added: pdfAdded,
            },
        } = await this.getPublicationView();

        // Dynamic entries
        const entries: CatalogEntryView[] = [
            {
                title: __("catalog.entry.continueReading"),
                totalCount: epubReaded.length,
                publicationViews: epubReaded,
            },
            {
                title: __("catalog.entry.lastAdditions"),
                totalCount: epubAdded.length,
                publicationViews: epubAdded,
            },
            {
                title: __("catalog.entry.continueReadingAudioBooks"),
                totalCount: audiobookReaded.length,
                publicationViews: audiobookReaded,
            },
            {
                title: __("catalog.entry.lastAdditionsAudioBooks"),
                totalCount: audiobookAdded.length,
                publicationViews: audiobookAdded,
            },
            {
                title: __("catalog.entry.continueReadingDivina"),
                totalCount: divinaReaded.length,
                publicationViews: divinaReaded,
            },
            {
                title: __("catalog.entry.lastAdditionsDivina"),
                totalCount: divinaAdded.length,
                publicationViews: divinaAdded,
            },
            {
                title: __("catalog.entry.continueReadingPdf"),
                totalCount: pdfReaded.length,
                publicationViews: pdfReaded,
            },
            {
                title: __("catalog.entry.lastAdditionsPdf"),
                totalCount: pdfAdded.length,
                publicationViews: pdfAdded,
            },
        ];

        return {
            entries,
        };
    }

    private async getPublicationView() {

        const fillArrayPubView = (
            array: PublicationView[],
            doc: PublicationDocument | undefined,
            filter: (view: PublicationView) => boolean,
        ) => {

            if (doc) {
                if (array.length <= NB_PUB) {
                    try {
                        const view = this.publicationViewConverter.convertDocumentToView(doc);
                        if (filter(view)) {

                            array.push(view);
                        }
                    } catch (e) {
                        debug("Error in convertDocumentToView doc=", doc);
                        this.store.dispatch(toastActions.openRequest.build(ToastType.Error, doc.title || ""));

                        debug(`${doc.identifier} => ${doc.title} should be removed`);
                        try {
                            // tslint:disable-next-line: no-floating-promises
                            // this.publicationService.deletePublication(doc.identifier);
                            const sagaMiddleware = diMainGet("saga-middleware");
                            const pubApi = diMainGet("publication-api");
                            // tslint:disable-next-line: no-floating-promises
                            sagaMiddleware.run(pubApi.delete, doc.identifier).toPromise();
                        } catch {
                            // ignore
                        }
                    }
                }
            }
        };

        const fillPubView = (
            doc: PublicationDocument | undefined,
            key: keyof ICatalogReadedOrAdded,
            obj: ICatalogCategories,
        ) => {

            fillArrayPubView(obj.audio[key], doc, isAudiobookFn);
            fillArrayPubView(obj.divina[key], doc, isDivinaFn);
            fillArrayPubView(obj.pdf[key], doc,
                (view: PublicationView) => {
                    const r2PublicationStr = Buffer.from(view.r2PublicationBase64, "base64").toString("utf-8");
                    const r2PublicationJson = JSON.parse(r2PublicationStr);
                    const r2Publication = TaJsonDeserialize<R2Publication>(r2PublicationJson, R2Publication);
                    return isPdfFn(r2Publication);
                },
            );
            fillArrayPubView(obj.epub[key], doc,
                (view: PublicationView) => {
                    const r2PublicationStr = Buffer.from(view.r2PublicationBase64, "base64").toString("utf-8");
                    const r2PublicationJson = JSON.parse(r2PublicationStr);
                    const r2Publication = TaJsonDeserialize<R2Publication>(r2PublicationJson, R2Publication);
                    return !isAudiobookFn(view) && !isDivinaFn(view) && !isPdfFn(r2Publication);
                },
            );

        };

        const lastAddedPublicationsDocument = await this.getLastAddedPublicationDocument();

        const lastAddedPublicationsDocumentArray = lastAddedPublicationsDocument.map(
            (doc) => this.getLastReadingPublicationId().includes(doc.identifier)
                ? [doc, undefined]
                : [undefined, doc],
        );

        return lastAddedPublicationsDocumentArray.reduce<ICatalogCategories>(
            (pv, cv) => {

                const [docInReadingQueue, docFreshlyAdded] = cv;

                fillPubView(docInReadingQueue, "readed", pv);
                fillPubView(docFreshlyAdded, "added", pv);

                return pv;
            },
            {
                audio: {
                    readed: [],
                    added: [],
                },
                divina: {
                    readed: [],
                    added: [],
                },
                epub: {
                    readed: [],
                    added: [],
                },
                pdf: {
                    readed: [],
                    added: [],
                },
            },
        );

    }

    private async getLastAddedPublicationDocument() {

        const lastAddedPublications = await this.publicationRepository.find({
            sort: [{ createdAt: "desc" }],
            selector: {},
        });

        return lastAddedPublications;
    }

    private getLastReadingPublicationId(): string[] {

        const lastReading = this.store.getState().publication.lastReadingQueue;
        const pubIdArray = lastReading.map(([, pubId]) => pubId);

        return pubIdArray;
    }
}
