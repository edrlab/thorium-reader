// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as fs from "fs";
import * as moment from "moment";

import { TaJsonDeserialize, TaJsonSerialize } from "@r2-lcp-js/serializable";
import { initGlobalConverters_OPDS } from "@r2-opds-js/opds/init-globals";
import { OPDSFeed } from "@r2-opds-js/opds/opds2/opds2";
import { OPDSLink } from "@r2-opds-js/opds/opds2/opds2-link";
import { OPDSMetadata } from "@r2-opds-js/opds/opds2/opds2-metadata";
import { OPDSPublication } from "@r2-opds-js/opds/opds2/opds2-publication";
import {
    initGlobalConverters_GENERIC, initGlobalConverters_SHARED,
} from "@r2-shared-js/init-globals";
import { Metadata } from "@r2-shared-js/models/metadata";
import { Publication } from "@r2-shared-js/models/publication";
import { PublicationParsePromise } from "@r2-shared-js/parser/publication-parser";
import { isHTTP } from "@r2-utils-js/_utils/http/UrlUtils";

initGlobalConverters_OPDS();
initGlobalConverters_SHARED();
initGlobalConverters_GENERIC();

// import * as debug_ from "debug";
// const debug = debug_("r2:streamer#http/opds2-create-cli");

console.log(`process.cwd(): ${process.cwd()}`);
console.log(`__dirname: ${__dirname}`);

let args = process.argv.slice(2);
// console.log("process.argv.slice(2): %o", args);

if (!args.length) {
    console.log("FILEPATH ARGUMENTS ARE MISSING.");
    process.exit(1);
}
const opdsJsonFilePath = args[0];
args = args.slice(1);
if (fs.existsSync(opdsJsonFilePath)) {
    console.log("OPDS2 JSON file already exists.");
    process.exit(1);
}

// tslint:disable-next-line:no-floating-promises
(async () => {
    const feed = new OPDSFeed();

    // TODO: what is the JSON-LD context URL?
    // https://drafts.opds.io/opds-2.0
    // https://github.com/opds-community/test-catalog/tree/master/2.0
    // JSON SCHEMA:
    // "@context": {
    //     "type": ["string", "array"],
    //     "items": {
    //       "type": "string"
    //     },
    //     "uniqueItems": true
    //   },
    // feed.Context = ["http://opds-spec.org/opds.jsonld"];

    feed.Metadata = new OPDSMetadata();
    feed.Metadata.RDFType = "http://schema.org/DataFeed";
    feed.Metadata.Title = "Readium 2 OPDS 2.0 Feed";
    feed.Metadata.Modified = moment(Date.now()).toDate();

    feed.Publications = [];

    let nPubs = 0;
    for (const pathBase64 of args) {
        const pathBase64Str = Buffer.from(decodeURIComponent(pathBase64), "base64").toString("utf8");

        if (isHTTP(pathBase64Str)) {
            continue;
        }

        // const fileName = path.basename(pathBase64Str);
        // const ext = path.extname(fileName);

        console.log(`OPDS parsing: ${pathBase64Str}`);
        let publication: Publication;
        try {
            publication = await PublicationParsePromise(pathBase64Str);
        } catch (err) {
            console.log(err);
            continue;
        }

        nPubs++;

        const publi = new OPDSPublication();

        publi.Links = [];
        const linkSelf = new OPDSLink();
        linkSelf.Href = pathBase64 + "/manifest.json";
        linkSelf.TypeLink =
            (publication.Metadata && publication.Metadata.RDFType &&
            /https?:\/\/schema\.org\/Audiobook$/.test(publication.Metadata.RDFType)) ?
            "application/audiobook+json" : ((publication.Metadata && publication.Metadata.RDFType &&
                (/https?:\/\/schema\.org\/ComicStory$/.test(publication.Metadata.RDFType) ||
                /https?:\/\/schema\.org\/VisualNarrative$/.test(publication.Metadata.RDFType))) ? "application/divina+json" :
                    "application/webpub+json");
        linkSelf.AddRel("http://opds-spec.org/acquisition");
        publi.Links.push(linkSelf);

        feed.Publications.push(publi);

        publi.Images = [];
        const coverLink = publication.GetCover();
        if (coverLink) {
            const linkCover = new OPDSLink();
            linkCover.Href = pathBase64 + "/" + coverLink.Href;
            linkCover.TypeLink = coverLink.TypeLink;
            // linkCover.Rel = [];
            // linkCover.Rel.push("cover");

            if (coverLink.Width && coverLink.Height) {
                linkCover.Width = coverLink.Width;
                linkCover.Height = coverLink.Height;

            }
            publi.Images.push(linkCover);
        } else {
            console.log("NO COVER IMAGE?");
        }

        if (publication.Metadata) {
            try {
                const publicationMetadataJson = TaJsonSerialize(publication.Metadata);
                publi.Metadata = TaJsonDeserialize<Metadata>(publicationMetadataJson, Metadata);
            } catch (err) {
                console.log(err);
                continue;
            }
        }
    }

    feed.Metadata.NumberOfItems = nPubs;

    const jsonObj = TaJsonSerialize(feed);
    const jsonStr = global.JSON.stringify(jsonObj, null, "");
    fs.writeFileSync(opdsJsonFilePath, jsonStr, { encoding: "utf8" });

    console.log("DONE! :)");
    console.log(opdsJsonFilePath);
})();
