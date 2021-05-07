// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { deepStrictEqual, ok } from "assert";
import * as debug_ from "debug";
import { app } from "electron";
import { appendFileSync, promises as fsp } from "fs";
import { clone } from "ramda";
import { LocaleConfigIdentifier, LocaleConfigValueType } from "readium-desktop/common/config";
import { LocatorType } from "readium-desktop/common/models/locator";
import { TBookmarkState } from "readium-desktop/common/redux/states/bookmark";
import { I18NState } from "readium-desktop/common/redux/states/i18n";
import { AvailableLanguages } from "readium-desktop/common/services/translator";
import { ConfigDocument } from "readium-desktop/main/db/document/config";
import { OpdsFeedDocument } from "readium-desktop/main/db/document/opds";
import { ConfigRepository } from "readium-desktop/main/db/repository/config";
import {
    backupStateFilePathFn, CONFIGREPOSITORY_REDUX_PERSISTENCE, diMainGet, memoryLoggerFilename,
    patchFilePath, runtimeStateFilePath, stateFilePath,
} from "readium-desktop/main/di";
import { reduxSyncMiddleware } from "readium-desktop/main/redux/middleware/sync";
import { rootReducer } from "readium-desktop/main/redux/reducers";
import { rootSaga } from "readium-desktop/main/redux/sagas";
import { PersistRootState, RootState } from "readium-desktop/main/redux/states";
import { IS_DEV } from "readium-desktop/preprocessor-directives";
import { ObjectKeys } from "readium-desktop/utils/object-keys-values";
import { tryCatch, tryCatchSync } from "readium-desktop/utils/tryCatch";
import { applyMiddleware, createStore, Store } from "redux";
import createSagaMiddleware, { SagaMiddleware } from "redux-saga";
import { applyPatch } from "rfc6902";

import { reduxPersistMiddleware } from "../middleware/persistence";
import { IDictPublicationState } from "../states/publication";
import { IDictWinRegistryReaderState } from "../states/win/registry/reader";

// import { composeWithDevTools } from "remote-redux-devtools";
const REDUX_REMOTE_DEVTOOLS_PORT = 7770;

const debugStdout = debug_("readium-desktop:main:store:memory");
// Logger
const debug = (...a: Parameters<debug_.Debugger>) => {
    debugStdout(...a);
    tryCatchSync(() =>
        appendFileSync(memoryLoggerFilename, a.map((v) => `${+new Date()} ${JSON.stringify(v)}`).join("\n") + "\n"),
        "",
    );
};

const defaultLocale = (): LocaleConfigValueType => {
    const loc = app.getLocale().split("-")[0];
    const langCodes = ObjectKeys(AvailableLanguages);
    const lang = langCodes.find((l) => l === loc) || "en";

    return {
        locale: lang,
    };
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

                const bookmarkFromRedux = reader.bookmark || [];
                const bookmarkFromPouchdbConverted = bookmarkFromDb.reduce<TBookmarkState>((pv, cv) =>
                    cv.publicationIdentifier === locator.publicationIdentifier
                        && !bookmarkFromRedux.find(([, v]) => v.uuid === cv.identifier)
                        ? [
                            ...pv,
                            [
                                ++counter,
                                {
                                    uuid: cv.identifier,
                                    name: cv.name || "",
                                    locator: cv.locator,
                                },
                            ],
                        ]
                        : pv,
                    [],
                );

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

const absorbOpdsFeedToReduxState = async (docs: OpdsFeedDocument[] | undefined) => {

    const opdsFeedRepository = diMainGet("opds-feed-repository");

    const opdsFromDb = await opdsFeedRepository.findAllFromPouchdb();

    let newDocs = docs || [];
    debug("DB ABSORB OPDS init", newDocs);

    for (const doc of opdsFromDb) {
        const { identifier } = doc;
        const idx = newDocs.findIndex((v) => v.identifier === identifier);

        if (newDocs[idx]) {

            // note that this actually never occurs because OPDS feeds are immutable (no dynamic tags, no title rename)
            if (newDocs[idx].doNotMigrateAnymore) {
                debug(`DB ABSORB OPDS doNotMigrateAnymore: ${identifier} ${idx}`);
                continue;
            }

            debug(`DB ABSORB OPDS override: ${identifier} ${idx}`);

            const newDoc = clone(doc);
            // we DO NOT set this here (see opdsActions.addOpdsFeed, and comment for OpdsFeedDocument.doNotMigrateAnymore)
            // newDoc.doNotMigrateAnymore = true;

            newDocs = [
                ...newDocs.slice(0, idx),
                newDoc,
                ...newDocs.slice(idx + 1),
            ];
        } else {
            debug(`DB ABSORB OPDS append: ${identifier} ${idx}`);

            const newDoc = clone(doc);
            // we DO NOT set this here (see opdsActions.addOpdsFeed, and comment for OpdsFeedDocument.doNotMigrateAnymore)
            // newDoc.doNotMigrateAnymore = true;

            newDocs = [
                ...newDocs,
                newDoc,
            ];
        }
    }

    return newDocs;
};

const absorbPublicationToReduxState = async (pubs: IDictPublicationState | undefined) => {

    const publicationRepository = diMainGet("publication-repository");
    // const PublicationViewConverter = diMainGet("publication-view-converter");

    const pubsFromDb = await publicationRepository.findAllFromPouchdb();

    const newPubs = pubs || {};
    debug("DB ABSORB PUB init", newPubs);

    for (const pub of pubsFromDb) {
        const { identifier } = pub;

        if (newPubs[identifier]?.doNotMigrateAnymore) {
            debug(`DB ABSORB PUB doNotMigrateAnymore: ${identifier}`);
            continue;
        }

        if (!newPubs[identifier] || !newPubs[identifier].doNotMigrateAnymore) {

            if (typeof ((pub as any)["r2PublicationBase64"]) !== "undefined") {
                delete (pub as any)["r2PublicationBase64"];
            }
            if (typeof ((pub as any)["r2OpdsPublicationBase64"]) !== "undefined") {
                delete (pub as any)["r2OpdsPublicationBase64"];
            }
            if (pub.lcp) {
                if (typeof ((pub.lcp as any)["r2LCPBase64"]) !== "undefined") {
                    delete (pub.lcp as any)["r2LCPBase64"];
                }
                if (pub.lcp.lsd) {
                    if (typeof ((pub.lcp.lsd as any)["r2LSDBase64"]) !== "undefined") {
                        delete (pub.lcp.lsd as any)["r2LSDBase64"];
                    }
                    if (pub.lcp.lsd.lsdStatus) {
                        if (typeof ((pub.lcp.lsd.lsdStatus as any)["events"]) !== "undefined") {
                            delete (pub.lcp.lsd.lsdStatus as any)["events"];
                        }
                    }
                }
            }

            debug(`DB ABSORB PUB override: ${identifier}`);

            const newDoc = clone(pub);
            // we DO NOT set this here (see publicationActions.addPublication, and comment for PublicationDocument.doNotMigrateAnymore)
            // newDoc.doNotMigrateAnymore = true;
            newPubs[identifier] = newDoc;
        }
    }

    return newPubs;
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

const checkReduxState = async (runtimeState: object, reduxState: PersistRootState) => {

    deepStrictEqual(runtimeState, reduxState);

    debug("hydration state is certified compliant");

    return reduxState;
};

const runtimeState = async (): Promise<object> => {
    const runtimeStateStr = await tryCatch(() => fsp.readFile(runtimeStateFilePath, { encoding: "utf8" }), "");
    const runtimeState = await tryCatch(() => JSON.parse(runtimeStateStr), "");

    ok(typeof runtimeState === "object");

    return runtimeState;
};

const recoveryReduxState = async (runtimeState: object): Promise<object> => {

    const patchFileStrRaw = await tryCatch(() => fsp.readFile(patchFilePath, { encoding: "utf8" }), "");
    const patchFileStr = "[" + patchFileStrRaw.slice(0, -2) + "]"; // remove the last comma
    const patch = await tryCatch(() => JSON.parse(patchFileStr), "");

    ok(Array.isArray(patch));

    const errors = applyPatch(runtimeState, patch);

    ok(errors.reduce((pv, cv) => pv && !cv, true));

    ok(typeof runtimeState === "object", "state not defined after patch");

    return runtimeState;
};

const test = (stateRaw: any): stateRaw is PersistRootState => {
    ok(typeof stateRaw === "object");
    ok(stateRaw.win);
    ok(stateRaw.publication);
    ok(stateRaw.reader);
    ok(stateRaw.session);

    return stateRaw;
};

export async function initStore(configRepository: ConfigRepository<any>)
    : Promise<[Store<RootState>, SagaMiddleware<object>]> {

    let reduxStateWinRepository: ConfigDocument<PersistRootState>;
    let reduxState: PersistRootState | undefined;

    debug("");
    debug("MEMORY INIT STORE");

    try {

        const jsonStr = await fsp.readFile(stateFilePath, { encoding: "utf8" });
        const json = JSON.parse(jsonStr);
        if (test(json))
            reduxState = json;

        debug("STATE LOADED FROM FS");
        debug("the state doesn't come from pouchDb !");
        debug("😍😍😍😍😍😍😍😍");

    } catch {

        try {
            const reduxStateRepositoryResult = await configRepository.get(CONFIGREPOSITORY_REDUX_PERSISTENCE);
            reduxStateWinRepository = reduxStateRepositoryResult;
            reduxState = reduxStateWinRepository?.value
                ? reduxStateWinRepository.value
                : undefined;

            // TODO:
            // see main/redux/actions/win/registry/registerReaderPublication.ts
            // action creator also deletes highlight + info
            if (reduxState?.win?.registry?.reader) {
                const keys = Object.keys(reduxState.win.registry.reader);
                for (const key of keys) {
                    const obj = reduxState.win.registry.reader[key];
                    if (obj?.reduxState?.info) {
                        delete obj.reduxState.info;
                    }
                    if (obj?.reduxState?.highlight) {
                        delete obj.reduxState.highlight;
                    }
                }
            }

            if (reduxState) {
                debug("STATE LOADED FROM POUCHDB");
                debug("the state doesn't come from the new json filesystem database");
                debug("😩😩😩😩😩😩😩");
            }

        } catch (err) {

            debug("ERR when trying to get the state in Pouchb configRepository", err);
        }
    }

    try {
        const state = await recoveryReduxState(await runtimeState());
        reduxState = await checkReduxState(state, reduxState);

        debug("RECOVERY WORKS lvl 1/4");
    } catch (e) {

        debug("N-1 STATE + PATCH != STATE");
        debug("Your state is probably corrupted");
        debug("If it is a fresh thorium installation do not worry");
        debug("If it is a migration from Thorium 1.6 to Thorium 1.7 do not worry too, migrtion process will start");
        debug(e);

        try {

            test(reduxState);

            debug("RECOVERY : the state is provided from the pouchdb database or from potentially corrupted state.json file");
            debug("the last state.json seems good after a quick test on it !");
            debug("state - 1 + patch is not used");
            debug("recovery state come from state.json");
            debug("REVOVERY WORKS lvl 2/4");
        } catch {
            try {

                const stateRawFirst = await runtimeState();
                test(stateRawFirst);
                const stateRaw: any = await recoveryReduxState(stateRawFirst);
                test(stateRaw);
                reduxState = stateRaw;

                debug("RECOVERY : the state is provided from the state - 1 + patch");
                debug("There should be no data loss");
                debug("REVOVERY WORKS lvl 3/4");

            } catch {
                try {

                    const stateRawFirst: any = await runtimeState();
                    test(stateRawFirst);
                    reduxState = stateRawFirst;

                    debug("RECOVERY : the state is the previous runtime snapshot");
                    debug("There should be data loss !");
                    debug("RECOVERY WORKS 4/4");
                } catch {

                    // do not erase reduxState for security purpose
                    // reduxState = undefined;
                    debug("REDUX STATE IS CORRUPTED THE TEST FAILED");
                    debug("For security purpose the state is not erase");
                    debug("Be carefull, an unexpected behaviour may occur");
                    debug("RECOVERY FAILED none of the 4 recoveries mode worked");
                }

            }
        } finally {

            const p = backupStateFilePathFn();
            await tryCatch(() =>
                fsp.writeFile(p, JSON.stringify(reduxState), { encoding: "utf8" }),
                "");

            debug("RECOVERY : a state backup file is copied in " + p);
            debug("keep it safe, you may restore a corrupted state with it");
        }

    } finally {

        await tryCatch(() =>
            fsp.writeFile(
                runtimeStateFilePath,
                reduxState ? JSON.stringify(reduxState) : "",
                { encoding: "utf8" },
            )
            , "");

        // the file doen't have a top array [...]
        // we need to add it before the parsing
        await tryCatch(() => fsp.writeFile(patchFilePath, "", { encoding: "utf8" }), "");
    }

    if (!reduxState) {
        debug("####### WARNING ######");
        debug("Thorium starts with a fresh new session");
        debug("There are no DATABASE on the filesystem");
        debug("####### WARNING ######");
    }

    debug("REDUX STATE VALUE :: ", typeof reduxState, reduxState ? Object.keys(reduxState) : "nil");
    // debug(reduxState);

    try {

        // Be carefull not an object copy / same reference
        reduxState.win.registry.reader =
            await absorbBookmarkToReduxState(reduxState.win.registry.reader);

    } catch (e) {

        debug("ERR on absorb bookmark to redux state", e);
    }

    try {

        // Be carefull not an object copy / same reference
        reduxState.publication.db =
            await absorbPublicationToReduxState(reduxState.publication.db);

    } catch (e) {

        debug("ERR on absorb publication to redux state", e);
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

    const preloadedState = reduxState ? {
        ...reduxState,
    } : {};

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
