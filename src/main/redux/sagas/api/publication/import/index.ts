// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";
import { ToastType } from "readium-desktop/common/models/toast";
import { toastActions } from "readium-desktop/common/redux/actions";
import { IOpdsLinkView, IOpdsPublicationView } from "readium-desktop/common/views/opds";
import { PublicationView, canOpenPublication } from "readium-desktop/common/views/publication";
import { diMainGet } from "readium-desktop/main/di";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { put } from "redux-saga/effects";
import { SagaGenerator } from "typed-redux-saga";
import { all as allTyped, call as callTyped } from "typed-redux-saga/macro";

import { importFromFsService } from "./importFromFs";
import { importFromLinkService } from "./importFromLink";
import { importFromStringService } from "./importFromString";
import { PublicationDocument } from "readium-desktop/main/db/document/publication";
import { PublicationViewConverter } from "readium-desktop/main/converter/publication";
import { getTranslator } from "readium-desktop/common/services/translator";
import { publicationApi } from "..";
import { cleanupLcpPublicationIfNoLongerUsable } from "readium-desktop/main/redux/sagas/publication/lcpSharedWorkstationCleanup";
import { INoteState } from "readium-desktop/common/redux/states/renderer/note";
import { RootState } from "readium-desktop/main/redux/states";
import { settingsLcpAutoDeleteExpiredPublicationsIsEnabled } from "readium-desktop/common/redux/states/settings";
import { sqliteTableNoteInsertOrReplace, sqliteTableSelectAllNotesWherePubId } from "readium-desktop/main/db/sqlite/note";
import type { TFileTypePubData } from "readium-desktop/main/storage/publication-data";

// import { appActivate } from "readium-desktop/main/redux/sagas/win/library";
// import { readerActions } from "readium-desktop/common/redux/actions";

// Logger
const debug = debug_("readium-desktop:main#saga/api/publication/import");

const convertDoc = async (doc: PublicationDocument, publicationViewConverter: PublicationViewConverter) => {
    try {
    return await publicationViewConverter.convertDocumentToView(doc);
    } catch (e) {
        debug("Error to convert document to publicationView", e);
        const pub = await publicationViewConverter.convertUnavailableDocumentToMinimalPublicationView(doc);
        debug("Convert to minimal view", pub);
        return pub;
    }
};

const PERSONAL_MODE_REPLACEMENT_READING_DATA_TYPES: TFileTypePubData[] = [
    "locator",
    "config",
    "disableRTLFlip",
    "divina",
    "allowCustomConfig",
    "pdfConfig",
    "bound",
];

type TPersonalModeReplacementPublicationData = Partial<Record<TFileTypePubData, object>>;

interface IPersonalModeReplacementUserData {
    noteTotalCount: number;
    notes: INoteState[];
    publicationData: TPersonalModeReplacementPublicationData;
}

const emptyPersonalModeReplacementUserData = (): IPersonalModeReplacementUserData => ({
    noteTotalCount: 0,
    notes: [],
    publicationData: {},
});

const getPersonalModeReplacementUserData = async (publicationIdentifier: string): Promise<IPersonalModeReplacementUserData> => {
    const store = diMainGet("store");
    const state: RootState = store.getState();
    if (settingsLcpAutoDeleteExpiredPublicationsIsEnabled(state.settings)) {
        return emptyPersonalModeReplacementUserData();
    }

    const notes = sqliteTableSelectAllNotesWherePubId(publicationIdentifier);
    const publicationData = diMainGet("publication-data");
    const replacementPublicationData: TPersonalModeReplacementPublicationData = {};

    for (const type of PERSONAL_MODE_REPLACEMENT_READING_DATA_TYPES) {
        const jsonObj = await publicationData.readJsonObj(publicationIdentifier, type);
        if (jsonObj) {
            replacementPublicationData[type] = jsonObj;
        }
    }

    const maxNoteIndex = notes.reduce((acc, note) => Math.max(acc, note.index || 0), 0);
    const noteTotalCountState = await publicationData.readJsonObj(publicationIdentifier, "noteTotalCount") as {
        state?: unknown;
    } | undefined;
    const noteTotalCount = typeof noteTotalCountState?.state === "number"
        ? Math.max(noteTotalCountState.state, maxNoteIndex)
        : maxNoteIndex;

    debug(
        `captured ${notes.length} note(s) and ${Object.keys(replacementPublicationData).length} publication-data file(s) before personal-mode LCP replacement`,
        publicationIdentifier,
    );
    return {
        noteTotalCount,
        notes,
        publicationData: replacementPublicationData,
    };
};

const restorePersonalModeReplacementUserData = async (
    publicationIdentifier: string | undefined,
    replacementUserData: IPersonalModeReplacementUserData,
) => {
    if (!publicationIdentifier) {
        return;
    }

    const publicationData = diMainGet("publication-data");
    for (const [type, jsonObj] of Object.entries(replacementUserData.publicationData) as Array<[TFileTypePubData, object]>) {
        await publicationData.writeJsonObj(publicationIdentifier, type, jsonObj);
    }

    // Replacement imports create a new publication identifier. Reassigning the captured
    // note UUIDs with INSERT OR REPLACE preserves annotations/bookmarks even if the old
    // publication delete saga has not finished deleting the previous pub_id rows yet.
    if (replacementUserData.notes.length) {
        sqliteTableNoteInsertOrReplace(publicationIdentifier, replacementUserData.notes);
    }

    if (replacementUserData.noteTotalCount > 0) {
        await publicationData.writeJsonObj(publicationIdentifier, "noteTotalCount", {
            state: replacementUserData.noteTotalCount,
        });
    }
};

export function* importFromLink(
    link: IOpdsLinkView,
    willBeImmediatelyFollowedByOpen: boolean,
    pub?: IOpdsPublicationView,
    deep: number = 0,
): SagaGenerator<PublicationView | undefined> {

    const translate = getTranslator().translate;

    try {

        const [publicationDocument, alreadyImported] = yield* callTyped(importFromLinkService, link, willBeImmediatelyFollowedByOpen, pub);

        if (!publicationDocument) {
            throw new Error("publicationDocument not imported on db");
        }

        const publicationViewConverter = diMainGet("publication-view-converter");
        const publicationView = yield* callTyped(() => convertDoc(publicationDocument, publicationViewConverter));

        if (alreadyImported) {

            if (deep < 1) {
                const retryDeep = deep + 1;
                const replacementUserData = yield* callTyped(
                    () => getPersonalModeReplacementUserData(publicationDocument.identifier),
                );

                const cleanedPublicationDocument = yield* callTyped(
                    cleanupLcpPublicationIfNoLongerUsable,
                    publicationDocument,
                    "import-from-link",
                    // User-initiated replacement import may remove a locally expired old copy
                    // even when LSD cannot confirm a terminal status.
                    { force: true, allowLocalRightsEndFallback: true },
                );
                if (!cleanedPublicationDocument) {
                    debug("restart import process after LCP cleanup");
                    const replacementPublicationView = yield* callTyped(importFromLink, link, willBeImmediatelyFollowedByOpen, pub, retryDeep);
                    yield* callTyped(
                        () => restorePersonalModeReplacementUserData(replacementPublicationView?.identifier, replacementUserData),
                    );
                    return replacementPublicationView;
                }

                if (!canOpenPublication(publicationView)) {

                    debug(`${publicationDocument?.identifier} => ${publicationDocument?.title} should be removed`);
                    const str = `The publication is missing or deleted: ${publicationDocument?.identifier} => ${publicationDocument?.title}. The directory must be deleted.`;
                    try {
                        debug("delete publication", publicationDocument.identifier);
                        yield* callTyped(publicationApi.delete, publicationDocument.identifier, str);
                    } catch (e) {
                        debug("publication not deleted", e);
                    }
                    try {
                        debug("restart import process after publication was already imported, missing, but not deleted");
                        return yield* callTyped(importFromLink, link, willBeImmediatelyFollowedByOpen, pub, retryDeep);
                    } catch (e) {
                        debug("Error during the second import of the publication", e);
                        return undefined;
                    }
                } else {

                    yield put(
                        toastActions.openRequest.build(
                            ToastType.Success,
                            translate("message.import.alreadyImport",
                                { title: publicationView.documentTitle }),
                        ),
                    );
                }
            } else if (deep === 1) {
                debug("importFromLink already imported after retry -> STOP!");
            } else if (deep > 1) {
                debug("importFromLink too many call stack -> STOP!");
            }


        } else {
            yield put(
                toastActions.openRequest.build(
                    ToastType.Success,
                    translate("message.import.success",
                        { title: publicationView.documentTitle }),
                ),
            );

        }

        return publicationView;

    } catch (e: any) {

        debug("importFromLink failed", e.toString(), e.trace);
        yield put(
            toastActions.openRequest.build(
                ToastType.Error,
                translate("message.import.fail",
                    { path: link.url, err: e?.toString() }),
            ),
        );
    }

    return undefined;
}

export function* importFromString(
    manifest: string,
    willBeImmediatelyFollowedByOpen: boolean,
    baseFileUrl: string, // should starts with 'file://'
): SagaGenerator<PublicationView | undefined> {

    if (manifest) {

        try {
            const [publicationDocument]  = yield* callTyped(importFromStringService, manifest, willBeImmediatelyFollowedByOpen, baseFileUrl);

            if (!publicationDocument) {
                throw new Error("publicationDocument not imported on db");
            }

            const publicationViewConverter = diMainGet("publication-view-converter");

            return yield* callTyped(() => convertDoc(publicationDocument, publicationViewConverter));

        } catch (error) {
            throw new Error(`importFromLink error ${error}`);
        }
    }

    return undefined;
}

export function* importFromFs(
    filePath: string | string[],
    willBeImmediatelyFollowedByOpen: boolean,
    deep: number = 0,
): SagaGenerator<PublicationView[] | undefined> {

    const filePathArray = Array.isArray(filePath) ? filePath : [filePath];

    const publicationViewConverter = diMainGet("publication-view-converter");

    const effects = filePathArray.map(
        (fpath: string) =>
            callTyped(function*(): SagaGenerator<PublicationView> {

                const translate = getTranslator().translate;

                try {

                    // const { b: [publicationDocument, alreadyImported] } = yield* raceTyped({
                    //     a: delay(30000),
                    //     b: callTyped(importFromFsService, fpath),
                    // });
                    const data = yield* callTyped(importFromFsService, fpath, willBeImmediatelyFollowedByOpen);
                    if (!data) {
                        throw new Error("importFromFsService undefined");
                    }
                    const [publicationDocument, alreadyImported] = data;

                    if (!publicationDocument) {
                        throw new Error("publicationDocument not imported on db");
                    }

                    const publicationView = yield* callTyped(() => convertDoc(publicationDocument, publicationViewConverter));

                    if (alreadyImported) {

                        if (deep < 1) {
                            const retryDeep = deep + 1;
                            const replacementUserData = yield* callTyped(
                                () => getPersonalModeReplacementUserData(publicationDocument.identifier),
                            );

                            const cleanedPublicationDocument = yield* callTyped(
                                cleanupLcpPublicationIfNoLongerUsable,
                                publicationDocument,
                                "import-from-fs",
                                // User-initiated replacement import may remove a locally expired old copy
                                // even when LSD cannot confirm a terminal status.
                                { force: true, allowLocalRightsEndFallback: true },
                            );
                            if (!cleanedPublicationDocument) {
                                debug("restart import process after LCP cleanup");
                                const publicationViews = yield* callTyped(importFromFs, fpath, willBeImmediatelyFollowedByOpen, retryDeep);
                                const replacementPublicationView = publicationViews?.[0];
                                yield* callTyped(
                                    () => restorePersonalModeReplacementUserData(replacementPublicationView?.identifier, replacementUserData),
                                );
                                return replacementPublicationView;
                            }

                            if (!canOpenPublication(publicationView)) {

                                debug(`${publicationDocument?.identifier} => ${publicationDocument?.title} should be removed`);
                                const str = `The publication is missing or deleted: ${publicationDocument?.identifier} => ${publicationDocument?.title}. The directory must be deleted.`;
                                try {
                                    debug("delete publication", publicationDocument.identifier);
                                    yield* callTyped(publicationApi.delete, publicationDocument.identifier, str);
                                } catch (e) {
                                    debug("publication not deleted", e);
                                }
                                try {
                                    debug("restart import process after publication was already imported, missing, but not deleted");
                                    const publicationViews = yield* callTyped(importFromFs, fpath, willBeImmediatelyFollowedByOpen, retryDeep);
                                    return publicationViews?.[0];
                                } catch (e) {
                                    debug("Error during the second import of the publication", e);
                                    return undefined;
                                }
                            } else {

                                yield put(
                                    toastActions.openRequest.build(
                                        ToastType.Success,
                                        translate("message.import.alreadyImport",
                                            { title: publicationView.documentTitle }),
                                    ),
                                );
                            }
                        } else if (deep === 1) {
                            debug("importFromFs already imported after retry -> STOP!");
                        } else if (deep > 1) {
                            debug("importFromFs too many call stack -> STOP!");
                        }

                    } else {
                        yield put(
                            toastActions.openRequest.build(
                                ToastType.Success,
                                translate("message.import.success",
                                    { title: publicationView.documentTitle }),
                            ),
                        );
                    }

                    return publicationView;

                } catch (error) {

                    debug("importFromFs (hash + import) fail with :" + filePath, error);
                    yield put(
                        toastActions.openRequest.build(
                            ToastType.Error,
                            translate("message.import.fail",
                                { path: filePath, err: error?.toString() }),
                        ),
                    );
                }

                return undefined;
            }),
    );

    const pubViews = yield* allTyped(effects);
    const publicationViews = pubViews.filter((pubView) => pubView);

    // // UNCOMMENT THIS TO SIMULATE DOUBLE-CLICK ON LCP-PROTECTED EPUB OR LCPL IN FILESYSTEM,
    // // NOT ONLY DOWNLOADS/IMPORTS THE FILE, ALSO OPENS THE READER
    // // see main/redux/sagas/event.ts
    // // const chan = getOpenFileFromCliChannel();
    // if (publicationViews?.[0]) {
    //     yield* callTyped(appActivate);
    //     yield put(readerActions.openRequest.build(publicationViews[0].identifier));
    //     yield put(readerActions.detachModeRequest.build());
    // }

    // TEST PURPOSE
    // const identifier = publicationViews[0].identifier;
    // yield* fork(function*() {
    //     yield* delay(400);
    //     debug("DELETE !!", identifier);
    //     yield* callTyped(() => publicationApi.delete(identifier));
    //     debug("END DELETE !!", identifier);
    // });

    return publicationViews;
}
