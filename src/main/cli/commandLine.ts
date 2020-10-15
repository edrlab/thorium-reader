// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { readerActions } from "readium-desktop/common/redux/actions";
import { selectTyped } from "readium-desktop/common/redux/sagas/typed-saga";
import { PublicationView } from "readium-desktop/common/views/publication";
import { diMainGet } from "readium-desktop/main/di";
import { put, take } from "typed-redux-saga";
import { URL } from "url";

import { initSuccess } from "../redux/actions/app";
import { RootState } from "../redux/states";
import { AppStatus } from "../redux/states/app";

// Logger
const debug = debug_("readium-desktop:main:cli:commandLine");

async function openReader(publicationView: PublicationView | PublicationView[]) {
    const pubView = Array.isArray(publicationView) ? publicationView[0] : publicationView;
    if (pubView) {
        const sagaMiddleware = diMainGet("saga-middleware");

        await sagaMiddleware.run(function*() {

            const appState = yield* selectTyped((state: RootState) => state.app.status);

            if (appState !== AppStatus.Initialized) {

                // wait to end of initialization
                yield take(initSuccess.ID);
            }

            yield put(readerActions.openRequest.build(pubView.identifier));

        }).toPromise();
        return true;
    }
    return false;
}

export async function openTitleFromCli(title: string): Promise<boolean> {

    const sagaMiddleware = diMainGet("saga-middleware");
    const pubApi = diMainGet("publication-api");
    const pubViews = await sagaMiddleware.run(pubApi.search, title).toPromise<PublicationView[]>();
    const state = await openReader(pubViews);
    return state;
}

// used also in lock.ts on mac
export async function openFileFromCli(filePath: string): Promise<boolean> {

    const sagaMiddleware = diMainGet("saga-middleware");
    const pubApi = diMainGet("publication-api");
    const pubViews = await sagaMiddleware.run(pubApi.importFromFs, filePath).toPromise<PublicationView[]>();
    const state = await openReader(pubViews);
    return state;
}

export async function cliImport(filePath: string[] | string) {

    debug("cliImport", filePath);

    // import a publication from local path
    let returnValue = true;
    const filePathArray = Array.isArray(filePath) ? filePath : [filePath];

    const sagaMiddleware = diMainGet("saga-middleware");
    const pubApi = diMainGet("publication-api");
    for (const fp of filePathArray) {

        debug("cliImport filePath in filePathArray: ", fp);
        const pubViews = await sagaMiddleware.run(pubApi.importFromFs, fp).toPromise<PublicationView[]>();

        if (!pubViews && pubViews.length === 0) {
            returnValue = false;
        }
    }
    return returnValue;
}

export async function cliOpds(title: string, url: string) {
    // save an opds feed with title and url in the db
    const hostname = (new URL(url)).hostname;
    if (hostname) {

        const opdsRepository = diMainGet("opds-feed-repository");
        const opdsFeedDocument = await opdsRepository.save({ title, url });

        return !!opdsFeedDocument;
    }
    return false;
}
