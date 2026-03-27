// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";
import { catalogActions, readerActions } from "readium-desktop/common/redux/actions";
import { PublicationRepository } from "readium-desktop/main/db/repository/publication";
import { error } from "readium-desktop/main/tools/error";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { all } from "redux-saga/effects";
import { call as callTyped, put as putTyped, select as selectTyped, debounce as debounceTyped, SagaGenerator } from "typed-redux-saga/macro";
import { RootState } from "../states";
import { diMainGet, getReaderWindowFromDi } from "readium-desktop/main/di";
// import { isPdfFn } from "readium-desktop/common/isManifestType";

// import { PublicationView } from "readium-desktop/common/views/publication";
// import { TaJsonDeserialize } from "@r2-lcp-js/serializable";
// import { Publication as R2Publication } from "@r2-shared-js/models/publication";
import { CatalogEntryView } from "readium-desktop/common/views/catalog";
import { aboutFiltered } from "readium-desktop/main/tools/filter";
import { publicationActions as publicationActionsFromMainAction } from "../actions";
import { publicationActions as publicationActionsFromCommonAction } from "readium-desktop/common/redux/actions";
import { takeSpawnLatest } from "readium-desktop/common/redux/sagas/takeSpawnLatest";
import { spawnLeading } from "readium-desktop/common/redux/sagas/spawnLeading";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import { PublicationView } from "readium-desktop/common/views/publication";
import { EventPayload } from "readium-desktop/common/ipc/sync";
import { SenderType } from "readium-desktop/common/models/sync";

const filename_ = "readium-desktop:main:redux:sagas:catalog";
const debug = debug_(filename_);

const NB_PUB = 10;

// TODO: this memo-ization is very expensive (memory and CPU-wise) ...
// and TaJsonDeserialize() is called in several other places in the library lifecycle
// (including below via convertDocumentToView())
// so it would make sense to hoist the cache higher in the application architecture
// const viewToR2Pub = (view: PublicationView) => {
//     // Legacy Base64 data blobs
//     // const r2PublicationStr = Buffer.from(view.r2PublicationBase64, "base64").toString("utf-8");
//     // const r2PublicationJson = JSON.parse(r2PublicationStr);
//     const r2Publication = TaJsonDeserialize(view.r2PublicationJson, R2Publication);

//     return r2Publication;
// };
// const _pdfMemo: {[str: string]: boolean} = {};
// const isPdfMemo = (view: PublicationView): boolean => {
//     if (typeof _pdfMemo[view.identifier] === "undefined") {
//         const r2Publication = viewToR2Pub(view);
//         _pdfMemo[view.identifier] = isPdfFn(r2Publication);
//     }
//     return _pdfMemo[view.identifier];
// };


const getLastAddedPublicationDocument = async (publicationRepository: PublicationRepository) => {

    const lastAddedPublications = await publicationRepository.findAllSortDesc();
    return lastAddedPublications;
};

function* getLastReadingPublicationId() {

    const lastReading = yield* selectTyped((state: RootState) => state.publication.lastReadingQueue);
    const pubIdArray = lastReading.map(([, pubId]) => pubId);
    return pubIdArray;
}

function* getReadingFinishedPublicationId() {

    const lastReading = yield* selectTyped((state: RootState) => state.publication.readingFinishedQueue);
    const pubIdArray = lastReading.map(([, pubId]) => pubId);
    return pubIdArray;
}

// function* errorDeletePub(doc: PublicationDocument | undefined, e: Error) {
//     debug("Error in convertDocumentToView doc=", doc);

//     yield* putTyped(toastActions.openRequest.build(ToastType.Error, doc?.title || ""));

//     debug(`${doc?.identifier} => ${doc?.title} should be removed`);
//     const str = typeof e.toString === "function" ? e.toString() : (typeof e.message === "string" ? e.message : (typeof e === "string" ? e : JSON.stringify(e)));
//     try {
//         yield* callTyped(publicationApi.delete, doc.identifier, str);
//     } catch (e) {
//         // ignore
//         debug("publication not deleted", e);
//     }
// };

function* getPublicationView() {

    // uncomment this in case of DB corruption, will allow Thorium to launch library bookshelf (empty)
    // return {
    // audio: {readed: [], added:[]},
    // epub: {readed: [], added:[]},
    // divina: {readed: [], added:[]},
    // pdf: {readed: [], added:[]},
    // all: {readed: [], added:[]},
    // };

    const publicationRepository = diMainGet("publication-repository");
    const publicationViewConverter = diMainGet("publication-view-converter");
    const lastAddedPublicationsDocumentRaw = yield* callTyped(getLastAddedPublicationDocument, publicationRepository);
    const lastReadingPubArray = yield* callTyped(getLastReadingPublicationId);
    const lastReadingFinishedPubArray = yield* callTyped(getReadingFinishedPublicationId);

    const lastAddedPublicationsDocument =
        lastAddedPublicationsDocumentRaw.filter(({ identifier }) => !lastReadingPubArray.includes(identifier) && !lastReadingFinishedPubArray.includes(identifier));
    const lastReadedPublicationDocument =
        lastReadingPubArray
            .map(
                (identifier) => lastAddedPublicationsDocumentRaw.find((v) => v.identifier === identifier),
            )
            .filter((v) => !!v);
    // const readingFinishedPublicationDocument =
    //     lastReadingFinishedPubArray
    //         .map(
    //             (identifier) => lastAddedPublicationsDocumentRaw.find((v) => v.identifier === identifier),
    //         )
    //         .filter((v) => !!v);

    const lastAddedPublicationsView: PublicationView[] = [];
    debug("Start converting the last added documents to publicationView ");
    for (const doc of lastAddedPublicationsDocument) {
        try {
            // for test delay purpose, DO NOT FORGET TO COMMENT IT
            // yield* delayTyped(100);
            //////

            const pub = yield* callTyped(() => publicationViewConverter.convertDocumentToView(doc));
            lastAddedPublicationsView.push(pub);
        } catch (e) {
            debug("Error When convert document to view, the publication is not deleted, so let's mitigate the publication error for the next time");
            debug(e);

            const pub = yield* callTyped(() => publicationViewConverter.convertDocumentMissingOrDeletedToMinimalPublicationView(doc));
            lastAddedPublicationsView.push(pub);

            // yield* callTyped(errorDeletePub, doc, e as Error);
        }
    }

    const lastReadPublicationsView: PublicationView[] = [];
    debug("Start converting the last read documents to publicationView ");
    for (const doc of lastReadedPublicationDocument) {
        try {
            // for test delay purpose, DO NOT FORGET TO COMMENT IT
            // yield* delayTyped(100);
            //////

            const pub = yield* callTyped(() => publicationViewConverter.convertDocumentToView(doc));
            lastReadPublicationsView.push(pub);
        } catch (e) {
            debug("Error When convert document to view, the publication is not deleted, so let's mitigate the publication error for the next time");
            debug(e);

            const pub = yield* callTyped(() => publicationViewConverter.convertDocumentMissingOrDeletedToMinimalPublicationView(doc));
            lastReadPublicationsView.push(pub);

            // yield* callTyped(errorDeletePub, doc, e as Error);
        }
    }

    // const audio = {
    //     readed: lastReadedPublicationsView.filter(isAudiobookFn),
    //     added: lastAddedPublicationsView.filter(isAudiobookFn),
    // };

    // const divina = {
    //     readed: lastReadedPublicationsView.filter(isDivinaFn),
    //     added: lastAddedPublicationsView.filter(isDivinaFn),
    // };

    // const pdf = {
    //     readed: lastReadedPublicationsView.filter(
    //         (view: PublicationView) => {
    //             return isPdfMemo(view);
    //         }),
    //     added: lastAddedPublicationsView.filter(
    //         (view: PublicationView) => {
    //             return isPdfMemo(view);
    //         }),
    // };

    // const epub = {
    //     readed: lastReadedPublicationsView.filter(
    //         (view: PublicationView) => {
    //             return !isAudiobookFn(view) && !isDivinaFn(view) && !isPdfMemo(view);
    //         }),
    //     added: lastAddedPublicationsView.filter(
    //         (view: PublicationView) => {
    //             return !isAudiobookFn(view) && !isDivinaFn(view) && !isPdfMemo(view);
    //         }),
    // };

    const all = {
        read: lastReadPublicationsView,
        added: lastAddedPublicationsView,
    };

    return {
        // audio,
        // epub,
        // divina,
        // pdf,
        all,
    };
}

// export defined
// used to preloaded redux state in library win
export function* getCatalog(): SagaGenerator<ILibraryRootState["publication"]> {
    debug("getCatalog");

    const {
        // audio: {
        //     readed: audiobookReaded,
        // },
        // divina: {
        //     readed: divinaReaded,
        // },
        // epub: {
        //     readed: epubReaded,
        // },
        // pdf: {
        //     readed: pdfReaded,
        // },
        all: {
            added: allAdded,
            read: allRead,
        },
    } = yield* callTyped(getPublicationView);

    const _allAdded = aboutFiltered(allAdded);
    const _allRead = aboutFiltered(allRead);
    // const _epubReaded = aboutFiltered(epubReaded);

    const allAdded_ = _allAdded.slice(0, NB_PUB);
    const allRead_ = _allRead.slice(0, NB_PUB);
    // const epubReaded_ = _epubReaded.slice(0, NB_PUB);
    // const audiobookReaded_ = audiobookReaded.slice(0, NB_PUB);
    // const divinaReaded_ = divinaReaded.slice(0, NB_PUB);
    // const pdfReaded_ = pdfReaded.slice(0, NB_PUB);

    // Dynamic entries
    const entries: CatalogEntryView[] = [
        {
            id: "continueReading",
            totalCount: allRead.length,
            publicationViews: allRead_,
        },
        {
            id: "lastAdditions",
            totalCount: allAdded_.length,
            publicationViews: allAdded_,
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
    yield* debounceTyped(500, [readerActions.setLocator.ID, publicationActionsFromCommonAction.readingFinished.ID], function* worker() {
        const nextState = yield* selectTyped((state: RootState) => state.publication.lastReadingQueue);

        const prevId = prevState.map(([_,v]) => v);
        const nextId = nextState.map(([_,v]) => v);
        if (!eq(prevId, nextId)) {
            debug("dispatch new catalog");
            yield* callTyped(getCatalogAndDispatchIt);
        }
        prevState = yield* selectTyped((state: RootState) => state.publication.lastReadingQueue);
    });
}

export function saga() {
    return all([
        takeSpawnLatest(
            [catalogActions.getCatalog.ID
                , publicationActionsFromMainAction.addPublication.ID
                , publicationActionsFromMainAction.deletePublication.ID],
            getCatalogAndDispatchIt,
            (e) => error(filename_ + ":getCatalogAndDispatchIt", e),
        ),
        spawnLeading(
            updateResumePosition,
            (e) => error(filename_ + ":updateResumePosition", e),
        ),
        takeSpawnLatest(
            publicationActionsFromCommonAction.readingFinished.ID,
            function* (action: publicationActionsFromCommonAction.readingFinished.TAction) {
                const { publicationIdentifier: pubId } = action.payload;
                const sender = action.sender as EventPayload["sender"];

                if (sender?.type !== SenderType.Renderer) {
                    debug("sender is not renderer !!!");
                    return;
                }
                let winId = sender.reader_pubId /* see syncFactory */ ? sender.identifier : undefined; // action dispatched from library;
                if (!winId) {
                    const readers = yield* selectTyped((state: RootState) => state.win.session.reader);
                    const reader = Object.values(readers).find((v) => v.publicationIdentifier === pubId);
                    if (!reader) {
                        debug("ERROR!!! no reader sender found in session !!!");
                        return;
                    }
                    winId = reader.identifier;
                }

                const reader = getReaderWindowFromDi(winId);
                if (reader && !reader?.isDestroyed() && !reader?.webContents?.isDestroyed()) {
                    debug(`CLOSE reader winId=${winId} pubId=${pubId}`);
                    yield* putTyped(readerActions.closeRequest.build(winId, pubId));
                } else {
                    debug(`READER winId=${winId} with pubId=${pubId} not found or destroyed from action=${JSON.stringify(action)}`);
                }
            },
            (e) => error(filename_ + ":closeReaderAfterReadingFinished", e),
        ),
    ]);
}
