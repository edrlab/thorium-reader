// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { readerActions } from "readium-desktop/common/redux/actions";
import { OpdsFeedRepository } from "readium-desktop/main/db/repository/opds";
import { PublicationRepository } from "readium-desktop/main/db/repository/publication";
import { container } from "readium-desktop/main/di";
import { RootState } from "readium-desktop/main/redux/states";
import { CatalogService } from "readium-desktop/main/services/catalog";
import { Store } from "redux";
import { URL } from "url";
import { isArray } from "util";

export async function cli_(filePath: string) {
    // import and read publication
    const catalogService = container.get("catalog-service") as CatalogService;
    const publication = await catalogService.importFile(filePath);
    const store = container.get("store") as Store<RootState>;
    if (publication) {
        store.dispatch({
            type: readerActions.ActionType.OpenRequest,
            payload: {
                publication: {
                    identifier: publication.identifier,
                },
            },
        });
    } else {
        return false;
    }
    return true;
}

export async function cliImport(filePath: string[] | string) {
    // import a publication from local path
    let returnValue = true;
    const filePathArray = isArray(filePath) ? filePath : [filePath];

    for (const fp of filePathArray) {
        const catalogService = container.get("catalog-service") as CatalogService;
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
        const opdsRepository = container.get("opds-feed-repository") as OpdsFeedRepository;
        await opdsRepository.save({ title, url });
        return true;
    }
    return false;
}

export async function cliRead(title: string) {
    // get the publication id then open it in reader
    const publicationRepo = container.get("publication-repository") as PublicationRepository;
    const publication = await publicationRepo.searchByTitle(title);
    if (publication && publication.length) {
        const store = container.get("store") as Store<RootState>;
        store.dispatch({
            type: readerActions.ActionType.OpenRequest,
            payload: {
                publication: {
                    identifier: publication[0].identifier,
                },
            },
        });
    } else {
        return false;
    }
    return true;
}
