// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { PublicationView } from "readium-desktop/common/views/publication";
import { diMainGet } from "readium-desktop/main/di";
// import { channel } from "redux-saga";
import { URL } from "url";

// export const openReaderChannel = channel<string>();

// Logger
const debug = debug_("readium-desktop:main:cli:commandLine");

// async function openReader(publicationView: PublicationView | PublicationView[]) {
//     const pubView = Array.isArray(publicationView) ? publicationView[0] : publicationView;
//     if (pubView) {

//         openReaderChannel.put(pubView.identifier);
//         writeFileSync(Path.resolve(app.getPath("desktop"), "__openfile__5.txt"), Buffer.from(pubView.identifier));

//         return true;
//     }
//     return false;
// }

// export async function openTitleFromCli(title: string): Promise<boolean> {

//     const sagaMiddleware = diMainGet("saga-middleware");
//     const pubApi = diMainGet("publication-api");
//     const pubViews = await sagaMiddleware.run(pubApi.search, title).toPromise<PublicationView[]>();
//     const state = await openReader(pubViews);
//     return state;
// }

// // used also in lock.ts on mac
// export async function openFileFromCli(filePath: string): Promise<boolean> {

//     const sagaMiddleware = diMainGet("saga-middleware");
//     const pubApi = diMainGet("publication-api");
//     const pubViews = await sagaMiddleware.run(pubApi.importFromFs, filePath).toPromise<PublicationView[]>();
//     const state = await openReader(pubViews);
//     return state;
// }

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

        // ensures no duplicates (same URL ... but may be different titles)
        const opdsFeeds = await opdsRepository.findAll();
        const found = opdsFeeds.find((o) => o.url === url);
        if (found) {
            return true;
        }

        const opdsFeedDocument = await opdsRepository.save({ title, url });
        return !!opdsFeedDocument;
    }
    return false;
}
