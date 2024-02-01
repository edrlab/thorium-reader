// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { catalogActions, readerActions, toastActions } from "readium-desktop/common/redux/actions";
import { PublicationRepository } from "readium-desktop/main/db/repository/publication";
import { error } from "readium-desktop/main/tools/error";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { all } from "redux-saga/effects";
import { call as callTyped, put as putTyped, select as selectTyped, debounce as debounceTyped, SagaGenerator } from "typed-redux-saga/macro";
import { RootState } from "../states";
import { PublicationDocument } from "readium-desktop/main/db/document/publication";
import { ToastType } from "readium-desktop/common/models/toast";
import { publicationApi } from "./api";
import { diMainGet } from "readium-desktop/main/di";
import { isAudiobookFn, isDivinaFn, isPdfFn } from "readium-desktop/common/isManifestType";

import { PublicationView } from "readium-desktop/common/views/publication";
import { TaJsonDeserialize } from "@r2-lcp-js/serializable";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";
import { CatalogEntryView } from "readium-desktop/common/views/catalog";
import { aboutFiltered } from "readium-desktop/main/tools/filter";
import { publicationActions } from "../actions";
import { takeSpawnLatest } from "readium-desktop/common/redux/sagas/takeSpawnLatest";
import { spawnLeading } from "readium-desktop/common/redux/sagas/spawnLeading";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";

const filename_ = "readium-desktop:main:redux:sagas:catalog";
const debug = debug_(filename_);

const NB_PUB = 10;

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


const getLastAddedPublicationDocument = async (publicationRepository: PublicationRepository) => {

    const lastAddedPublications = await publicationRepository.findAllSortDesc();
    return lastAddedPublications;
};

function* getLastReadingPublicationId() {

    const lastReading = yield* selectTyped((state: RootState) => state.publication.lastReadingQueue);
    const pubIdArray = lastReading.map(([, pubId]) => pubId);
    return pubIdArray;
}

function* errorDeletePub(doc: PublicationDocument | undefined, e: Error) {
    debug("Error in convertDocumentToView doc=", doc);

    yield* putTyped(toastActions.openRequest.build(ToastType.Error, doc?.title || ""));

    debug(`${doc?.identifier} => ${doc?.title} should be removed`);
    const str = typeof e.toString === "function" ? e.toString() : (typeof e.message === "string" ? e.message : (typeof e === "string" ? e : JSON.stringify(e)));
    try {
        yield* callTyped(publicationApi.delete, doc.identifier, str);
    } catch (e) {
        // ignore
        debug("publication not deleted", e);
    }
};

function* getPublicationView() {

    const publicationRepository = diMainGet("publication-repository");
    const publicationViewConverter = diMainGet("publication-view-converter");
    const lastAddedPublicationsDocumentRaw = yield* callTyped(getLastAddedPublicationDocument, publicationRepository);
    const lastReadingPubArray = yield* callTyped(getLastReadingPublicationId);

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
            lastAddedPublicationsView.push(yield* callTyped(() => publicationViewConverter.convertDocumentToView(doc)));
        } catch (e) {
            debug("lastadded publication view converter", e);
            yield* callTyped(errorDeletePub, doc, e);
        }
    }

    const lastReadedPublicationsView = [];
    for (const doc of lastReadedPublicationDocument) {
        try {
            lastReadedPublicationsView.push(yield* callTyped(() => publicationViewConverter.convertDocumentToView(doc)));
        } catch (e) {
            debug("lastreaded publication view converter", e);
            yield* callTyped(errorDeletePub, doc, e);
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

// export defined
// used to preloaded redux state in library win
export function* getCatalog(): SagaGenerator<ILibraryRootState["publication"]> {
    debug("getCatalog");

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
    } = yield* callTyped(getPublicationView);

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
            id: "lastAdditions",
            totalCount: allAdded_.length,
            publicationViews: allAdded_,
        },
        {
            id: "continueReading",
            totalCount: epubReaded_.length,
            publicationViews: epubReaded_,
        },
        {
            id: "continueReadingAudioBooks",
            totalCount: audiobookReaded_.length,
            publicationViews: audiobookReaded_,
        },
        {
            id: "continueReadingDivina",
            totalCount: divinaReaded_.length,
            publicationViews: divinaReaded_,
        },
        {
            id: "continueReadingPdf",
            totalCount: pdfReaded_.length,
            publicationViews: pdfReaded_,
        },
    ];
    const publicationRepository = diMainGet("publication-repository");
    const allTags = yield* callTyped(() => publicationRepository.getAllTags());

    return {catalog: {entries}, tag: allTags};
}

function* getCatalogAndDispatchIt() {

    const {catalog, tag} = yield* callTyped(getCatalog);

    yield* putTyped(catalogActions.setCatalog.build(catalog));
    yield* putTyped(catalogActions.setTagView.build(tag));
}

function* updateResumePosition() {

    const eq = (a: string[], b: string[]) => {
        if (a.length !== b.length) {
            return false;
        }
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) {
                return false;
            }
        }
        return true;
    };

    let prevState = yield* selectTyped((state: RootState) => state.publication.lastReadingQueue);
    yield* debounceTyped(500, readerActions.setReduxState.build, function* worker(){
        const nextState = yield* selectTyped((state: RootState) => state.publication.lastReadingQueue);

        const prevId = prevState.map(([_,v]) => v);
        const nextId = nextState.map(([_,v]) => v);
        if (!eq(prevId, nextId)) {
            yield* callTyped(getCatalogAndDispatchIt);
        }
        prevState = yield* selectTyped((state: RootState) => state.publication.lastReadingQueue);
    });
}

export function saga() {
    return all([
        takeSpawnLatest(
            [catalogActions.getCatalog.ID, publicationActions.addPublication.ID, publicationActions.deletePublication.ID],
            getCatalogAndDispatchIt,
            (e) => error(filename_ + ":getCatalogAndDispatchIt", e),
        ),
        spawnLeading(
            updateResumePosition,
            (e) => error(filename_ + ":updateResumePosition", e),
        ),
    ]);
}
