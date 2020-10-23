// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import * as path from "path";
import { acceptedExtensionObject } from "readium-desktop/common/extension";
import { extractFileFromZipToBuffer } from "readium-desktop/main/zip/extract";

import { LCP } from "@r2-lcp-js/parser/epub/lcp";
import { TaJsonDeserialize } from "@r2-lcp-js/serializable";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";
import { EpubParsePromise } from "@r2-shared-js/parser/epub";

// Logger
const debug = debug_("readium-desktop:main/publicationParsePromise.ts");

export async function publicationParseFromPathToR2Publication(filePath: string): Promise<R2Publication | undefined> {

    if (!filePath) {
        return undefined;
    }

    let r2Publication: R2Publication;

    const { ext } = path.parse(filePath);
    switch (ext) {

        case acceptedExtensionObject.epub:
        case acceptedExtensionObject.epub3:

            debug("epub extension", ext);

            r2Publication = await EpubParsePromise(filePath);

            // after PublicationParsePromise, cleanup zip handler
            // (no need to fetch ZIP data beyond this point)
            r2Publication.freeDestroy();

            break;

        // case acceptedExtensionObject.cbz:
            // r2Publication = await CbzParsePromise(filePath);
            // break;

        case acceptedExtensionObject.audiobook:
        case acceptedExtensionObject.audiobookLcp:
        case acceptedExtensionObject.audiobookLcpAlt:
        case acceptedExtensionObject.divina:
        case acceptedExtensionObject.webpub:
        case acceptedExtensionObject.pdfLcp:

            debug("extension of type readium publication", ext);

            const manifest = await extractFileFromZipToBuffer(filePath, "manifest.json");
            if (manifest) {
                debug("r2Publication found in zip");

                const manifestString = manifest.toString();
                const manifestJson = JSON.parse(manifestString);
                r2Publication = TaJsonDeserialize(manifestJson, R2Publication);

                // tslint:disable-next-line: max-line-length
                // https://github.com/readium/r2-shared-js/blob/1aa1a1c10fe56ccb99ef0ed2c15a198c46600e7a/src/parser/divina.ts#L137
                r2Publication.AddToInternal("type", ext.slice(1));

                // lcp licence extraction

                const lcpEntryName = "license.lcpl";
                const lcpBuffer = await extractFileFromZipToBuffer(filePath, lcpEntryName);
                if (lcpBuffer) {
                    debug("lcp licence found in zip");

                    const lcpString = lcpBuffer.toString();
                    const lcpJson = JSON.parse(lcpString);
                    const lcpl = TaJsonDeserialize(lcpJson, LCP);

                    lcpl.ZipPath = lcpEntryName;
                    lcpl.JsonSource = lcpString;
                    lcpl.init();

                    r2Publication.LCP = lcpl;
                }
            }

            break;

        default:

            debug("extension not recognized", ext);
            r2Publication = undefined;
            break;
    }

    return r2Publication;
}
