// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { readerActions } from "readium-desktop/common/redux/actions";
import { PublicationView } from "readium-desktop/common/views/publication";
import { diMainGet } from "readium-desktop/main/di";
import { URL } from "url";

// Logger
const debug = debug_("readium-desktop:main:cli:commandLine");

function openReader(publicationView: PublicationView | PublicationView[]) {
    if (Array.isArray(publicationView)) {
        publicationView = publicationView[0];
    }
    if (publicationView) {
        const store = diMainGet("store");
        // 09/09/2020 : any thoughts on this ?
        // TODO
        // FIXME
        // Can't call readerActions.openRequest before appInit
        // check the flow to throw appInit and openReader consecutively
        // and need to exec main here before to call openReader
        store.dispatch(readerActions.openRequest.build(publicationView.identifier));
        return true;
    }
    return false;
}

export async function openTitleFromCli(title: string) {

    const sagaMiddleware = diMainGet("saga-middleware");
    const pubApi = diMainGet("publication-api");
    const pubViews = await sagaMiddleware.run(pubApi.search, title).toPromise<PublicationView[]>();
    return openReader(pubViews);
}

// used also in lock.ts on mac
export async function openFileFromCli(filePath: string): Promise<boolean> {

    const sagaMiddleware = diMainGet("saga-middleware");
    const pubApi = diMainGet("publication-api");
    const pubViews = await sagaMiddleware.run(pubApi.importFromFs, filePath).toPromise<PublicationView[]>();
    return openReader(pubViews);
}

export async function cliImport(filePath: string[] | string) {

    debug("cliImport", filePath);

    // import a publication from local path
    let returnValue = true;
    const filePathArray = Array.isArray(filePath) ? filePath : [filePath];

    const sagaMiddleware = diMainGet("saga-middleware");
    const pubApi = diMainGet("publication-api");
    for (const fp of filePathArray) {

        debug(fp);
        const pubViews = await sagaMiddleware.run(pubApi.importFromFs, fp).toPromise<PublicationView[]>();

        if (pubViews?.length === 0) {
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
        await opdsRepository.save({ title, url });
        return true;
    }
    return false;
}
