// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { readerActions } from "readium-desktop/common/redux/actions";
import { container } from "readium-desktop/main/di";
import { Store } from "redux";
import * as yargs from "yargs";

import { OpdsFeedRepository } from "readium-desktop/main/db/repository/opds";
import { PublicationRepository } from "readium-desktop/main/db/repository/publication";
import { RootState } from "readium-desktop/main/redux/states";
import { CatalogService } from "readium-desktop/main/services/catalog";
import { URL } from "url";

export interface ICliParam {
    readonly argv: yargs.Arguments;
    quit: boolean;
}

export interface ICli {
    name: string;
    fct: (o: ICliParam) => Promise<boolean>;
    help: string[];
}

export const cli: ICli[] = [
    {
        name: "_",
        fct: async ({ argv }) => {
            let publicationOpenRequested = false;
            let returnValue = true;

            for (const filePath of argv._) {
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
        },
        help: [],
    },
    {
        name: "import",
        fct: async ({ argv }) => {
            const catalogService = container.get("catalog-service") as CatalogService;
            await catalogService.importFile(argv.import as string);
            return true;
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
            const hostname = (new URL(url)).hostname;
            const title = feed.length === 2 ? feed[0] : hostname;
            if (hostname) {
                const opdsRepository = container.get("opds-feed-repository") as OpdsFeedRepository;
                await opdsRepository.save({ title, url });
                return true;
            }
            return false;
        },
        help: [
            "--opds TITLE=URL | URL",
            "import opds feed url",
        ],
    },
    {
        name: "silent",
        fct: async (param) => {
            param.quit = true;
            return true;
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
            } else {
                process.stdout.write(`There is not publication title match for "${argv.read}"\n`);
                return false;
            }
            return true;
        },
        help: [
            "--read TITLE",
            "searches already-imported publications with the provided TITLE, and opens the reader with the first match",
        ],
    },

];
