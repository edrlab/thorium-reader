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
import { diSymbolTable } from "readium-desktop/main/diSymbolTable";
import { type Store } from "redux";

import { TaJsonDeserialize } from "@r2-lcp-js/serializable";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";

import { PublicationDocument } from "../db/document/publication";
import { PublicationRepository } from "../db/repository/publication";
import { diMainGet } from "../di";
import { aboutFiltered } from "../tools/filter";
import { RootState } from "../redux/states";

export const CATALOG_CONFIG_ID = "catalog";

const NB_PUB = 5;

// TODO: this memo-ization is very expensive (memory and CPU-wise) ...
// and TaJsonDeserialize() is called in several other places in the library lifecycle
// (including below via convertDocumentToView())
// so it would make sense to hoist the cache higher in the application architecture
const viewToR2Pub = (view: PublicationView) => {
    // Legacy Base64 data blobs
    // const r2PublicationStr = Buffer.from(view.r2PublicationBase64, "base64").toString("utf-8");
    // const r2PublicationJson = JSON.parse(r2PublicationStr);
    const r2Publication = TaJsonDeserialize(view.r2PublicationJson, R2Publication);

    return r2Publication;
};
const _pdfMemo: {[str: string]: boolean} = {};
const isPdfMemo = (view: PublicationView): boolean => {
    if (typeof _pdfMemo[view.identifier] === "undefined") {
        const r2Publication = viewToR2Pub(view);
        _pdfMemo[view.identifier] = isPdfFn(r2Publication);
    }
    return _pdfMemo[view.identifier];
};

// Logger
const debug = debug_("readium-desktop:main:api:catalog");

@injectable()
export class CatalogApi implements ICatalogApi {
    @inject(diSymbolTable["publication-repository"])
    private readonly publicationRepository!: PublicationRepository;

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
            },
            divina: {
                readed: divinaReaded,
            },
            epub: {
                readed: epubReaded,
            },
            pdf: {
                readed: pdfReaded,
            },
            all: {
                added: allAdded,
            },
        } = await this.getPublicationView();

        const _allAdded = aboutFiltered(allAdded);
        const _epubReaded = aboutFiltered(epubReaded);

        const allAdded_ = _allAdded.slice(0, NB_PUB);
        const epubReaded_ = _epubReaded.slice(0, NB_PUB);
        const audiobookReaded_ = audiobookReaded.slice(0, NB_PUB);
        const divinaReaded_ = divinaReaded.slice(0, NB_PUB);
        const pdfReaded_ = pdfReaded.slice(0, NB_PUB);

        // Dynamic entries
        const entries: CatalogEntryView[] = [
            {
                title: __("catalog.entry.lastAdditions"),
                totalCount: allAdded_.length,
                publicationViews: allAdded_,
            },
            {
                title: __("catalog.entry.continueReading"),
                totalCount: epubReaded_.length,
                publicationViews: epubReaded_,
            },
            {
                title: __("catalog.entry.continueReadingAudioBooks"),
                totalCount: audiobookReaded_.length,
                publicationViews: audiobookReaded_,
            },
            {
                title: __("catalog.entry.continueReadingDivina"),
                totalCount: divinaReaded_.length,
                publicationViews: divinaReaded_,
            },
            {
                title: __("catalog.entry.continueReadingPdf"),
                totalCount: pdfReaded_.length,
                publicationViews: pdfReaded_,
            },
        ];

        return {
            entries,
        };
    }

    private async getPublicationView() {

        // eslint-disable-next-line unused-imports/no-unused-vars
        const errorDeletePub = (doc: PublicationDocument | undefined, e: any) => {
            debug("Error in convertDocumentToView doc=", doc);

            this.store.dispatch(toastActions.openRequest.build(ToastType.Error, doc?.title || ""));

            debug(`${doc?.identifier} => ${doc?.title} should be removed`);
            try {
                const str = typeof e.toString === "function" ? e.toString() : (typeof e.message === "string" ? e.message : (typeof e === "string" ? e : JSON.stringify(e)));

                // tslint:disable-next-line: no-floating-promises
                // this.publicationService.deletePublication(doc.identifier, str);
                const sagaMiddleware = diMainGet("saga-middleware");
                const pubApi = diMainGet("publication-api");
                // tslint:disable-next-line: no-floating-promises
                sagaMiddleware.run(pubApi.delete, doc.identifier, str).toPromise();
            } catch {
                // ignore
            }
        };

        const lastAddedPublicationsDocumentRaw = await this.getLastAddedPublicationDocument();
        const lastReadingPubArray = this.getLastReadingPublicationId();

        const lastAddedPublicationsDocument =
            lastAddedPublicationsDocumentRaw.filter(({ identifier }) => !lastReadingPubArray.includes(identifier));
        const lastReadedPublicationDocument =
            lastReadingPubArray
                .map(
                    (identifier) => lastAddedPublicationsDocumentRaw.find((v) => v.identifier === identifier),
                )
                .filter((v) => !!v);

        const lastAddedPublicationsView = [];
        for (const doc of lastAddedPublicationsDocument) {
            try {
                lastAddedPublicationsView.push(await this.publicationViewConverter.convertDocumentToView(doc));
            } catch (e) {
                debug("lastadded publication view converter", e);
                errorDeletePub(doc, e);
            }
        }

        const lastReadedPublicationsView = [];
        for (const doc of lastReadedPublicationDocument) {
            try {
                lastReadedPublicationsView.push(await this.publicationViewConverter.convertDocumentToView(doc));
            } catch (e) {
                debug("lastreaded publication view converter", e);
                errorDeletePub(doc, e);
            }
        }

        const audio = {
            readed: lastReadedPublicationsView.filter(isAudiobookFn),
            added: lastAddedPublicationsView.filter(isAudiobookFn),
        };

        const divina = {
            readed: lastReadedPublicationsView.filter(isDivinaFn),
            added: lastAddedPublicationsView.filter(isDivinaFn),
        };

        const pdf = {
            readed: lastReadedPublicationsView.filter(
                (view: PublicationView) => {
                    return isPdfMemo(view);
                }),
            added: lastAddedPublicationsView.filter(
                (view: PublicationView) => {
                    return isPdfMemo(view);
                }),
        };

        const epub = {
            readed: lastReadedPublicationsView.filter(
                (view: PublicationView) => {
                    return !isAudiobookFn(view) && !isDivinaFn(view) && !isPdfMemo(view);
                }),
            added: lastAddedPublicationsView.filter(
                (view: PublicationView) => {
                    return !isAudiobookFn(view) && !isDivinaFn(view) && !isPdfMemo(view);
                }),
        };

        const all = {
            readed: lastReadedPublicationsView,
            added: lastAddedPublicationsView,
        };

        return {
            audio,
            epub,
            divina,
            pdf,
            all,
        };
    }

    private async getLastAddedPublicationDocument() {

        const lastAddedPublications = await this.publicationRepository.findAllSortDesc();

        return lastAddedPublications;
    }

    private getLastReadingPublicationId(): string[] {

        const lastReading = this.store.getState().publication.lastReadingQueue;
        const pubIdArray = lastReading.map(([, pubId]) => pubId);
        return pubIdArray;
    }
}
