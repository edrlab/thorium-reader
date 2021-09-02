// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { DOMWindow, JSDOM } from "jsdom";
import { tryDecodeURIComponent } from "readium-desktop/common/utils/uri";

// Logger
const debug = debug_("readium-desktop:main#w3c/audiobook/entry");
debug("_");

export function findManifestInHtmlWithIdAndReturnBuffer(window: DOMWindow, id: string) {
    const scriptEl: HTMLElement = window.document.getElementById(id);
    if (scriptEl && scriptEl.innerHTML) {
        const bufferManifest = Buffer.from(scriptEl.innerHTML);
        return bufferManifest;
    }

    return undefined;
}

export function findPublicationUrlInHtmlEntry(window: DOMWindow): string {

    const el: HTMLLinkElement = window.document.querySelector("link[rel=\"publication\"]");
    if (el) {
        const url = el.hasAttribute("href") ? tryDecodeURIComponent(el.href) : undefined;
        return url;

    }
    return undefined;
}

export async function findManifestFromHtmlEntryAndReturnBuffer(
    htmlBuffer: Buffer,
    fetcher: (fileName: string) => Promise<Buffer> | Buffer,
): Promise<[Buffer, string]> {

    if (htmlBuffer) {

        const text = htmlBuffer.toString("utf8");

        try {

            const { window } = new JSDOM(text);
            let url = findPublicationUrlInHtmlEntry(window);
            debug("manifest url", url);

            const skip = "about:blank";
            if (url?.startsWith(skip + "#")) {
                return [findManifestInHtmlWithIdAndReturnBuffer(window, url.slice(skip.length + 1)), undefined];

            } else if (url) {

                if (url.startsWith(skip)) {
                    url = url.slice(skip.length);
                }

                // fetch the manifest from lpf or network
                const buffer = await Promise.resolve(fetcher(url));
                if (buffer) {
                    return [buffer, url];
                } else {
                    throw new Error("w3c manifest not found");
                }
            } else {
                debug("url is undefined");
            }

        } catch (e) {
            debug("error to parse html", e);
        }

    }
    return [undefined, undefined];
}

// import { deepEqual, deepStrictEqual, ok } from "assert";
// // TEST
// if (require.main === module) {

//     // tslint:disable-next-line: no-floating-promises
//     (async () => {

//         const buff = Buffer.from(`<!DOCTYPE html>
//         <html>
//         <head>
//             <title>Entry point with embedded manifest</title>
//             <link rel="publication" href="#manifest" />
//             <script id='manifest' type='application/ld+json'>
//                 {
//                     "@context" : ["https://schema.org", "https://www.w3.org/ns/pub-context"],
//                     "type": "CreativeWork",
//                     "name" : "My Wonderful Book",
//                     "id" : "urn:isbn:1234567890",
//                     "url": "https://example.org/book",
//                     "conformsTo": "https://www.w3.org/TR/pub-manifest/",
//                     "readingOrder": [
//                         "chapter1.html"
//                     ],
//                     "resources": [
//                         "./m4.2.5.01.html"
//                     ]
//                 }
//             </script>
//         </head>
//         <body>
//             <p>This is just a fake entry point.</p>
//         </body>
//         </html>
//         `);

//         const manifestBuffer = Buffer.from(`
//                 {
//                     "@context" : ["https://schema.org", "https://www.w3.org/ns/pub-context"],
//                     "type": "CreativeWork",
//                     "name" : "My Wonderful Book",
//                     "id" : "urn:isbn:1234567890",
//                     "url": "https://example.org/book",
//                     "conformsTo": "https://www.w3.org/TR/pub-manifest/",
//                     "readingOrder": [
//                         "chapter1.html"
//                     ],
//                     "resources": [
//                         "./m4.2.5.01.html"
//                     ]
//                 }
//         `);

//         const manifestParsed = JSON.parse(manifestBuffer.toString("utf-8"));

//         const [b] = await findManifestFromHtmlEntryAndReturnBuffer(buff, () => manifestBuffer);

//         const manifestFoundParsed = JSON.parse(b.toString());

//         console.log("Buffer");
//         console.log(b.toString());

//         deepEqual(manifestParsed, manifestFoundParsed);
//     })();

//     // tslint:disable-next-line: no-floating-promises
//     (async () => {

//         const buff = Buffer.from(`<!DOCTYPE html>
//         <html>
//         <head>
//             <title>Entry point with embedded manifest</title>
//             <link rel="publication" href="http://helloworld" />
//             <script id='manifest' type='application/ld+json'>
//                 {
//                     "@context" : ["https://schema.org", "https://www.w3.org/ns/pub-context"],
//                     "type": "CreativeWork",
//                     "name" : "My Wonderful Book",
//                     "id" : "urn:isbn:1234567890",
//                     "url": "https://example.org/book",
//                     "conformsTo": "https://www.w3.org/TR/pub-manifest/",
//                     "readingOrder": [
//                         "chapter1.html"
//                     ],
//                     "resources": [
//                         "./m4.2.5.01.html"
//                     ]
//                 }
//             </script>
//         </head>
//         <body>
//             <p>This is just a fake entry point.</p>
//         </body>
//         </html>
//         `);

//         const manifestBuffer = Buffer.from(`
//                 {
//                     "@context" : ["https://schema.org", "https://www.w3.org/ns/pub-context"],
//                     "type": "CreativeWork",
//                     "name" : "My Wonderful Book",
//                     "id" : "urn:isbn:1234567890",
//                     "url": "https://example.org/book",
//                     "conformsTo": "https://www.w3.org/TR/pub-manifest/",
//                     "readingOrder": [
//                         "chapter1.html"
//                     ],
//                     "resources": [
//                         "./m4.2.5.01.html"
//                     ]
//                 }
//         `);

//         const manifestParsed = JSON.parse(manifestBuffer.toString("utf-8"));

//         const [b] = await findManifestFromHtmlEntryAndReturnBuffer(buff, (url) => {
//             deepStrictEqual(url, "http://helloworld/");

//             console.log("url", url, "return manifest");
//             return manifestBuffer;
//         });

//         ok(b);

//         const manifestFoundParsed = JSON.parse(b.toString());

//         console.log("Buffer");
//         console.log(b.toString());

//         deepEqual(manifestParsed, manifestFoundParsed);
//     })();

// }
