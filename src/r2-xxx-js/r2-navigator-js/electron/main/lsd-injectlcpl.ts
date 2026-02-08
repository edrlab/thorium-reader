// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import * as fs from "fs";

import { LCP } from "@r2-lcp-js/parser/epub/lcp";
import { TaJsonDeserialize } from "@r2-lcp-js/serializable";
import { Publication } from "@r2-shared-js/models/publication";
import { injectBufferInZip } from "@r2-utils-js/_utils/zip/zipInjector";

const debug = debug_("r2:navigator#electron/main/lsd-injectlcpl");

export async function lsdLcpUpdateInject(
    lcplStr: string,
    publication: Publication,
    publicationPath: string): Promise<string> {

    const lcplJson = global.JSON.parse(lcplStr);
    debug(lcplJson);

    const isAudio =
        publication.Metadata &&
        publication.Metadata.RDFType &&
        /https?:\/\/schema\.org\/Audiobook$/.test(publication.Metadata.RDFType);

    const zipEntryPath = isAudio ? "license.lcpl" : "META-INF/license.lcpl";

    let lcpl: LCP;
    try {
        lcpl = TaJsonDeserialize<LCP>(lcplJson, LCP);
    } catch (erorz) {
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        return Promise.reject(erorz);
    }
    lcpl.ZipPath = zipEntryPath;
    lcpl.JsonSource = lcplStr;
    lcpl.init();
    publication.LCP = lcpl;

    // https://github.com/readium/readium-lcp-specs/issues/15#issuecomment-358247286
    // application/vnd.readium.lcp.license-1.0+json (LEGACY)
    // application/vnd.readium.lcp.license.v1.0+json (NEW)
    // application/vnd.readium.license.status.v1.0+json (LSD)
    // const mime = "application/vnd.readium.lcp.license.v1.0+json";
    // publication.AddLink(mime, ["license"], lcpl.ZipPath, false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new Promise<any>(async (resolve, reject) => {
        const newPublicationPath = publicationPath + ".new";
        injectBufferInZip(publicationPath, newPublicationPath, Buffer.from(lcplStr, "utf8"), zipEntryPath,
            (err) => {
                // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                reject(err);
            },
            () => {
                debug("EPUB license.lcpl injected.");

                setTimeout(() => {
                    fs.unlinkSync(publicationPath);
                    setTimeout(() => {
                        fs.renameSync(newPublicationPath, publicationPath);
                        resolve(publicationPath);
                    }, 500);
                }, 500);
            });
    });
}
