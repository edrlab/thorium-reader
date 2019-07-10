// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { readerActions } from "readium-desktop/common/redux/actions";
import { container } from "readium-desktop/main/di";
import { extractHostname } from "readium-desktop/utils/hostname";
import { Store } from "redux";
import * as yargs from "yargs";

import { OpdsFeedRepository } from "readium-desktop/main/db/repository/opds";
import { PublicationRepository } from "readium-desktop/main/db/repository/publication";
import { RootState } from "readium-desktop/main/redux/states";
import { CatalogService } from "readium-desktop/main/services/catalog";

export interface ICliParam {
    readonly argv: yargs.Arguments;
    quit: boolean;
}

export interface ICli {
    name: string;
    fct: (o: ICliParam) => Promise<any>;
    help: string[];
}

export const cli: ICli[] = [
    {
        name: "_",
        fct: async ({ argv }) => {

            argv._.map(async (path) => {
                // import and read publication
                const catalogService = container.get("catalog-service") as CatalogService;
                const publication = await catalogService.importFile(path as string);
                const store = container.get("store") as Store<RootState>;
                try {
                    store.dispatch({
                        type: readerActions.ActionType.OpenRequest,
                        payload: {
                            publication: {
                                identifier: publication.identifier,
                            },
                        },
                    });
                } catch (e) {
                    if (path !== ".") {
                        console.error("Publication error, path:", path);
                    }
                }
            });
        },
        help: [],
    },
    {
        name: "import",
        fct: async ({ argv }) => {
            const catalogService = container.get("catalog-service") as CatalogService;
            return await catalogService.importFile(argv.import as string);
        },
        help: [
            "--import PATH",
            "import epub or lpcl file",
        ],
    },
    {
        name: "opds",
        fct: async ({ argv }) => {
            // extract and save the title and url from opdsFeed
            // title=http://myurl.com or get TLD and set url
            const feed = (argv.opds as string).split("=");
            const url = feed.length === 2 ? feed[1] : feed[0];
            const title = feed.length === 2 ? feed[0] : extractHostname(url, true);
            const opdsRepository = container.get("opds-feed-repository") as OpdsFeedRepository;
            return await opdsRepository.save({ title, url });
        },
        help: [
            "--opds URL",
            "import opds feed url",
        ],
    },
    {
        name: "silent",
        fct: async (param) => {
            param.quit = true;
        },
        help: [
            "--silent",
            "stay on command line and don't open main window",
        ],
    },
    {
        name: "read",
        fct: async ({ argv }) => {
            // read the publication name
            const publicationRepo = container.get("publication-repository") as PublicationRepository;
            const publication = await publicationRepo.searchByTitle(argv.read as string);
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
            }
        },
        help: [
            "--read STRING",
            "open the reader on your publication",
        ],
    },

];
