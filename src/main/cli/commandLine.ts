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

export async function cli_(filePathArray: string[]) {

    let publicationOpenRequested = false;
    let returnValue = true;

    for (const filePath of filePathArray) {
        // import and read publication
        const catalogService = container.get("catalog-service") as CatalogService;
        const publication = await catalogService.importFile(filePath);
        const store = container.get("store") as Store<RootState>;
        if (publication) {
            if (!publicationOpenRequested) {
                store.dispatch({
                    type: readerActions.ActionType.OpenRequest,
                    payload: {
                        publication: {
                            identifier: publication.identifier,
                        },
                    },
                });
                publicationOpenRequested = true;
            }
        } else {
            process.stderr.write(`Publication error for "${filePath}"\n`);
            returnValue = false;
        }
    }
    return returnValue;
}

export async function cliImport(filePath: string) {
    try {
        const catalogService = container.get("catalog-service") as CatalogService;
        if (!await catalogService.importFile(filePath)) {
            throw new Error();
        }
    } catch (e) {
        return false;
    }
    return true;
}

export async function cliOpds(arg: string) {
    // extract and save the title and url from opdsFeed
    // title=http://myurl.com or get TLD and set url
    const feed = arg.split("=");
    const url = feed.length === 2 ? feed[1] : feed[0];
    const hostname = (new URL(url)).hostname;
    const title = feed.length === 2 ? feed[0] : hostname;
    if (hostname) {
        const opdsRepository = container.get("opds-feed-repository") as OpdsFeedRepository;
        await opdsRepository.save({ title, url });
        return true;
    }
    return false;
}

export async function cliRead(argv: any) {
    // read the publication name
    const publicationRepo = container.get("publication-repository") as PublicationRepository;
    const publication = await publicationRepo.searchByTitle(argv.title);
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
        process.stdout.write(`There is no publication title match for "${argv.title}"\n`);
        return false;
    }
    return true;
}
