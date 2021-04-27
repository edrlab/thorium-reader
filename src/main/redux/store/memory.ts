// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { app } from "electron";
import { clone } from "ramda";
import { LocaleConfigIdentifier, LocaleConfigValueType } from "readium-desktop/common/config";
import { LocatorType } from "readium-desktop/common/models/locator";
import { TBookmarkState } from "readium-desktop/common/redux/states/bookmark";
import { I18NState } from "readium-desktop/common/redux/states/i18n";
import { AvailableLanguages } from "readium-desktop/common/services/translator";
import { ConfigDocument } from "readium-desktop/main/db/document/config";
import { OpdsFeedDocument } from "readium-desktop/main/db/document/opds";
import { ConfigRepository } from "readium-desktop/main/db/repository/config";
import { CONFIGREPOSITORY_REDUX_PERSISTENCE, diMainGet, patchFilePath, runtimeStateFilePath, stateFilePath } from "readium-desktop/main/di";
import { reduxSyncMiddleware } from "readium-desktop/main/redux/middleware/sync";
import { rootReducer } from "readium-desktop/main/redux/reducers";
import { rootSaga } from "readium-desktop/main/redux/sagas";
import { PersistRootState, RootState } from "readium-desktop/main/redux/states";
import { IS_DEV } from "readium-desktop/preprocessor-directives";
import { ObjectKeys } from "readium-desktop/utils/object-keys-values";
import { applyMiddleware, createStore, Store } from "redux";
import createSagaMiddleware, { SagaMiddleware } from "redux-saga";

import { reduxPersistMiddleware } from "../middleware/persistence";
import { IDictWinRegistryReaderState } from "../states/win/registry/reader";
import { promises as fsp } from "fs";
import { tryCatch } from "readium-desktop/utils/tryCatch";
import { deepStrictEqual, ok } from "assert";
import { applyPatch } from "rfc6902";

// import { composeWithDevTools } from "remote-redux-devtools";
const REDUX_REMOTE_DEVTOOLS_PORT = 7770;

// Logger
const debug = debug_("readium-desktop:main:store:memory");

const defaultLocale = (): LocaleConfigValueType => {
    const loc = app.getLocale().split("-")[0];
    const langCodes = ObjectKeys(AvailableLanguages);
    const lang = langCodes.find((l) => l === loc) || "en";

    return {
        locale: lang,
    };
};

// can be safely removed
// introduce in a thorium previous version
//
// async function absorbLocatorRepositoryToReduxState() {

//     const locatorRepository = diMainGet("locator-repository");
//     const locatorFromDb = await locatorRepository.find(
//         {
//             selector: { locatorType: LocatorType.LastReadingLocation },
//             sort: [{ updatedAt: "asc" }],
//         },
//     );


//     const lastReadingQueue: TPQueueState = [];
//     const registryReader: IDictWinRegistryReaderState = {};

//     for (const locator of locatorFromDb) {
//         if (locator.publicationIdentifier) {

//             lastReadingQueue.push([locator.createdAt, locator.publicationIdentifier]);

//             registryReader[locator.publicationIdentifier] = {
//                 windowBound: {
//                     width: 800,
//                     height: 600,
//                     x: 0,
//                     y: 0,
//                 },
//                 reduxState: {
//                     config: readerConfigInitialState,
//                     locator: LocatorExtendedWithLocatorOnly(locator.locator),
//                     bookmark: undefined,
//                     info: {
//                         publicationIdentifier: locator.publicationIdentifier,
//                         manifestUrlR2Protocol: undefined,
//                         manifestUrlHttp: undefined,
//                         filesystemPath: undefined,
//                         r2Publication: undefined,
//                         publicationView: undefined,
//                     },
//                     highlight: {
//                         handler: undefined,
//                         mounter: undefined,
//                     },
//                 },
//             };

//             await locatorRepository.delete(locator.identifier);
//         }
//     }

//     if (lastReadingQueue.length === 0 && ObjectKeys(registryReader).length === 0) {
//         return undefined;
//     }

//     return {
//         lastReadingQueue,
//         registryReader,
//     };
// }

const absorbOpdsFeedToReduxState = async (docs: OpdsFeedDocument[] | undefined) => {

    const opdsFeedRepository = diMainGet("opds-feed-repository");

    const opdsFromDb = await opdsFeedRepository.findAllFromPouchdb();

    let newDocs = docs || [];
    for (const doc of opdsFromDb) {
        const { identifier } = doc;
        const idx = newDocs.findIndex((v) => v.identifier === identifier);

        if (newDocs[idx]) {

            if (newDocs[idx].doNotMigrateAnymore) {
                continue;
            }

            newDocs = [
                ...newDocs.slice(0, idx),
                ...[
                    clone(doc),
                ],
                ...newDocs.slice(idx + 1),
            ];
        } else {
            newDocs = [
                ...newDocs,
                ...[
                    clone(doc),
                ],
            ];
        }
    }

    return newDocs;
};

const absorbBookmarkToReduxState = async (registryReader: IDictWinRegistryReaderState) => {

    const locatorRepository = diMainGet("locator-repository");

    const bookmarkFromDb = await locatorRepository.find(
        {
            selector: { locatorType: LocatorType.Bookmark },
            sort: [{ updatedAt: "asc" }],
        },
    );

    let counter = 0;

    for (const locator of bookmarkFromDb) {
        if (locator.publicationIdentifier) {

            const reader = registryReader[locator.publicationIdentifier]?.reduxState;
            if (reader) {


                // this is not a set reducer but a map reducer
                // so there is no merge with union set method
                const bookmarkFromRedux = reader.bookmark;
                const bookmarkFromPouchdbFiltered = bookmarkFromDb.filter((_v) => {
                    return !bookmarkFromRedux.find(([,v]) => v.uuid === _v.identifier);
                });
                const bookmarkFromPouchdbConverted = bookmarkFromPouchdbFiltered.reduce<TBookmarkState>((pv, cv) => [
                    ...pv,
                    [
                        ++counter,
                        {
                            uuid: cv.identifier,
                            name: cv.name || "",
                            locator: cv.locator,
                        },
                    ],
                ], []);

                const bookmark = [
                    ...bookmarkFromRedux,
                    ...bookmarkFromPouchdbConverted,
                ];

                reader.bookmark = bookmark;
            }
        }

    }

    return registryReader;
};

const absorbI18nToReduxState = async (
    configRepository: ConfigRepository<LocaleConfigValueType>,
    i18n: I18NState) => {


    if (i18n) {
        return i18n;
    }


    const i18nStateRepository = await configRepository.get(LocaleConfigIdentifier);
    i18n = i18nStateRepository?.value?.locale
        ? i18nStateRepository.value
        : defaultLocale();

    debug("LOCALE FROM POUCHDB", i18n);

    return i18n;
};

const checksReduxState = async (reduxState: PersistRootState) => {

    const runtimeStateStr = await tryCatch(() => fsp.readFile(runtimeStateFilePath, { encoding: "utf8" }), "");
    const runtimeState = await tryCatch(() => JSON.parse(runtimeStateStr), "");

    ok(typeof runtimeState === "object");

    const patchFileStr = await tryCatch(() => fsp.readFile(patchFilePath, { encoding: "utf8" }), "");
    const patch = await tryCatch(() => JSON.parse(patchFileStr), "");

    ok(Array.isArray(patch));

    const errors = applyPatch(runtimeStateStr, patch);

    ok(errors.reduce((pv, cv) => pv && !cv, true));

    deepStrictEqual(runtimeStateStr, reduxState);

    debug("reduxState is certified valid");

    return reduxState;
};

export async function initStore(configRepository: ConfigRepository<any>)
: Promise<[Store<RootState>, SagaMiddleware<object>]> {

    let reduxStateWinRepository: ConfigDocument<PersistRootState>;

    try {
        const reduxStateRepositoryResult = await configRepository.get(CONFIGREPOSITORY_REDUX_PERSISTENCE);
        reduxStateWinRepository = reduxStateRepositoryResult;

    } catch (err) {

        debug("ERR when trying to get the state in Pouchb configRepository", err);
    }

    let reduxState = reduxStateWinRepository?.value
        ? reduxStateWinRepository.value
        : undefined;

    if (!reduxState) {
        const stateFromFs = await tryCatch(() => fsp.readFile(stateFilePath, {encoding: "utf8"}), "");

        const json = await tryCatch(() => JSON.parse(stateFromFs), "");

        if (typeof json === "object") {
            reduxState = json;
        }
    }

    if (reduxState) {

        try {

            reduxState = await checksReduxState(reduxState);
        } catch (e) {
            // how to deal with rejection ?

            debug("####### ERROR ######");
            debug("Your database is corrupted");
            debug("");
            debug("####### ERROR ######");

            debug(e);

            reduxState = undefined; // TODO
        } finally {

            await tryCatch(() => fsp.writeFile(runtimeStateFilePath, reduxState ? JSON.stringify(reduxState): "", { encoding: "utf8" }), "");

            await tryCatch(() => fsp.writeFile(patchFilePath, "", { encoding: "utf8"}), "");
        }
    }

    if (!reduxState) {
        debug("####### WARNING ######");
        debug("Thorium starts with a fresh new session");
        debug("There are no DATABASE on the filesystem");
        debug("####### WARNING ######");
    }

    debug(reduxState);

    // new version of THORIUM
    // the migration can be safely removed
    //
    // try {
    //     // executed once time for locatorRepository to ReduxState migration
    //     const locatorRepositoryAbsorbed = await absorbLocatorRepositoryToReduxState();

    //     if (locatorRepositoryAbsorbed) {
    //         reduxStateWin = {
    //             ...reduxStateWin,
    //             ...{
    //                 publication: {
    //                     lastReadingQueue: Ramda.uniqBy(
    //                         (item) => item[1],
    //                         Ramda.concat(
    //                             reduxStateWin.publication.lastReadingQueue,
    //                             locatorRepositoryAbsorbed.lastReadingQueue,
    //                         ),
    //                     ),
    //                 },
    //             },
    //             ...{
    //                 win: {
    //                     session: {
    //                         library: reduxStateWin.win.session.library,
    //                         reader: reduxStateWin.win.session.reader,
    //                     },
    //                     registry: {
    //                         reader: {
    //                             ...locatorRepositoryAbsorbed.registryReader,
    //                             ...reduxStateWin.win.registry.reader,
    //                         },
    //                     },
    //                 },
    //             },
    //         };
    //     }
    // } catch (err) {
    //     debug("ERR on absorbLocatorRepositoryToReduxState", err);
    // }

    try {

        // Be carefull not an object copy / same reference
        reduxState.win.registry.reader =
            await absorbBookmarkToReduxState(reduxState.win.registry.reader);

    } catch (e) {

        debug("ERR on absorb bookmark to redux state", e);
    }

    try {

        reduxState.i18n = await absorbI18nToReduxState(configRepository, reduxState.i18n);
    } catch (e) {

        debug("ERR on absorb i18n to redux state", e);
    }

    try {
        reduxState.opds = {
            catalog: await absorbOpdsFeedToReduxState(reduxState.opds?.catalog),
        };
    } catch (e) {

        debug("ERR on absorb opds to redux state", e);
    }

    const preloadedState = {
        ...reduxState,
    };

    const sagaMiddleware = createSagaMiddleware();

    const mware = applyMiddleware(
        reduxSyncMiddleware,
        sagaMiddleware,
        reduxPersistMiddleware,
    );

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const middleware = IS_DEV ? require("remote-redux-devtools").composeWithDevTools(
        {
            port: REDUX_REMOTE_DEVTOOLS_PORT,
        },
    )(mware) : mware;

    const store = createStore(
        rootReducer,
        preloadedState,
        middleware,
    );

    sagaMiddleware.run(rootSaga);

    return [store as Store<RootState>, sagaMiddleware];
}
