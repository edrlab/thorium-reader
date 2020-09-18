// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
// https://github.com/mozilla/pdf.js/tree/master/examples/node
// import * as pdfjs from "pdfjs-dist/es5/build/pdf.js";
import { PDFExtract, PDFExtractOptions } from "pdf.js-extract";

import { Metadata as R2Metadata } from "@r2-shared-js/models/metadata";
import { Contributor } from "@r2-shared-js/models/metadata-contributor";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";

// Logger
const debug = debug_("readium-desktop:main/pdf/packager");

interface IInfo {
    PDFFormatVersion?: string;
    IsAcroFormPresent?: boolean;
    IsCollectionPresent?: boolean;
    IsLinearized?: boolean;
    IsXFAPresent?: boolean;
    Title?: string;
    Subject?: string;
    Keywords?: string;
    Author?: string;
    Creator?: string;
    Producer?: string;
    CreationDate?: string;
    ModDate?: string;
}

async function pdfManifest(pdfPath: string): Promise<R2Publication> {

    const pdfExtract = new PDFExtract();

    const options: PDFExtractOptions = {};
    const data = await pdfExtract.extract(pdfPath, options);

    const info = data.meta?.info as IInfo;
    const pages = data.pages;
    const pdfInfo = data.pdfInfo;

    const r2Publication = new R2Publication();

    if (info) {

        r2Publication.Metadata = new R2Metadata();

        {
            const title = info.Title;
            debug("title", title);

            if (title) {
                r2Publication.Metadata.Title = title;
            }
        }

        {
            const subject = info.Subject;
            debug("subject", subject);

            if (subject) {
                r2Publication.Metadata.Description = subject;
            }
        }

        {
            const author = info.Author;
            debug("author", author);

            if (author) {

                const contributor = new Contributor();
                contributor.Name = author;
                r2Publication.Metadata.Author = [contributor];
            }
        }

        {
            const producer = info.Producer;
            debug("producer", producer);

            if (producer) {

                const contributor = new Contributor();
                contributor.Name = producer;
                r2Publication.Metadata.Publisher = [contributor];
            }
        }

        {
            const creationDate = info.CreationDate;
            debug("creationDate", creationDate);

            if (creationDate) {

                // date converter "D:20200513091016+02'00'" => utc date
            }
        }

        {
            const modDate = info.ModDate;
            debug("modificationDate", modDate);
        }

        {
            const numberOfPage = pdfInfo?.numPages || Array.isArray(pages) ? pages.length : undefined;
            debug("number of page", numberOfPage);

            if (numberOfPage) {

                r2Publication.Metadata.NumberOfPages = numberOfPage;
            }
        }

    }

    const pageInfoOne = pages[0].pageInfo?.num === 1 ? pages[0].pageInfo : undefined;
    if (pageInfoOne) {

        // a browserWin can be create here with width and height to generate pdf cover
    }

    return r2Publication;
}

//
// API
//
export async function pdfPackager(pdfPath: string): Promise<string> {

    const manifest = pdfManifest(pdfPath);

    return undefined;

}
