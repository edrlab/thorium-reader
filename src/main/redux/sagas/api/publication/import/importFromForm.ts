// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { callTyped } from "readium-desktop/common/redux/sagas/typed-saga";
import { IOpdsLinkView } from "readium-desktop/common/views/opds";
import { PublicationDocument } from "readium-desktop/main/db/document/publication";
import { SagaGenerator } from "typed-redux-saga";
import { importFromLinkService } from "./importFromLink";
import { importFromStringService } from "./importFromString";

import { Publication as R2Publication } from "@r2-shared-js/models/publication";
import { Metadata } from "@r2-shared-js/models/metadata";
import { Link } from "@r2-shared-js/models/publication-link";
import { findMimeTypeWithExtension } from "readium-desktop/utils/mimeTypes";
import { TaJsonSerialize } from "r2-lcp-js/dist/es6-es2015/src/serializable";
import { ok } from "assert";
import { extname } from "path";
import { Contributor } from "r2-shared-js/dist/es6-es2015/src/models/metadata-contributor";

// Logger
const debug = debug_("readium-desktop:main#saga/api/publication/importFromFormService");

export function* importFromFormService(
    requestData: any,
): SagaGenerator<[publicationDoc: PublicationDocument, alreadyImported: boolean]> {

    // doing something with data
    debug("@@@@@@@@@@@@");
    debug("REQUEST FROM importFromFormService");
    debug(requestData);
    debug("@@@@@@@@@@@@");

    ok(typeof requestData === "object");
    const { data } = requestData;
    ok(typeof data === "object");
    const { url, manifestjson, title, des, author, cover, reading, baseurl } = data;

    if (url) {
        const link: IOpdsLinkView = {
            url,
        };

        return yield* callTyped(importFromLinkService, link);
    }

    if (manifestjson) {

        JSON.parse(manifestjson); // is a JSON format

        return yield* callTyped(importFromStringService, manifestjson, baseurl || "");
    }

    if (title && reading) {

        const pub = new R2Publication();

        pub.Context = ["https://readium.org/webpub-manifest/context.jsonld"];
        pub.Metadata = new Metadata();
        pub.Metadata.Title = title;
        pub.Metadata.Description = des || "";

        if (author) {
            const contrib = new Contributor();
            contrib.Name = author as string;
            pub.Metadata.Author = [contrib];
        }

        if (cover) {

            const coverLink = new Link();
            coverLink.Href = cover,
            coverLink.TypeLink = findMimeTypeWithExtension(cover);
            pub.Resources = [
                coverLink,
            ];

        }

        const urls = reading.replace(new RegExp("\r\n", "g"), "\n").split("\n") as string[];
        debug("Reading orders ", urls);
        pub.Spine = urls.map((u) => {

            if (u) {

                const l = new Link();
                l.Href = u;
                l.TypeLink = findMimeTypeWithExtension(extname(u));
                // l.Duration = mp3duration();

                return l;
            }
            return undefined;
        }).filter((v) => !!v);

        debug("PUBS", pub);

        const pubSerialize = TaJsonSerialize(pub);
        const pubString = JSON.stringify(pubSerialize);

        return yield* callTyped(importFromStringService, pubString, baseurl || "http://a.b");
    }
    return [undefined, false];
}
