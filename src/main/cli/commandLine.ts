// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { readerActions } from "readium-desktop/common/redux/actions";
import { PublicationView } from "readium-desktop/common/views/publication";
import { diMainGet } from "readium-desktop/main/di";
import { URL } from "url";
import { isArray } from "util";

function openReader(publication: PublicationView | PublicationView[]) {
    if (isArray(publication)) {
        publication = publication[0];
    }
    if (publication) {
        const store = diMainGet("store");
        store.dispatch({
            type: readerActions.ActionType.OpenRequest,
            payload: {
                publication: {
                    identifier: publication.identifier,
                },
            },
        });
        return true;
    }
    return false;
}

export async function openTitleFromCli(title: string) {
    const publicationApi = diMainGet("publication-api");
    const publication = await publicationApi.search(title);
    return openReader(publication);
}

// used also in lock.ts on mac
export async function openFileFromCli(filePath: string): Promise<boolean> {
    const publicationApi = diMainGet("publication-api");
    const publication = await publicationApi.import(filePath);
    return openReader(publication);
}

export async function cliImport(filePath: string[] | string) {
    // import a publication from local path
    let returnValue = true;
    const filePathArray = isArray(filePath) ? filePath : [filePath];

    for (const fp of filePathArray) {
        const catalogService = diMainGet("catalog-service");
        if (!await catalogService.importFile(fp)) {
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
