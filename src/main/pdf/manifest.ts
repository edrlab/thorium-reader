// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import * as path from "path";
import { mimeTypes } from "readium-desktop/utils/mimeTypes";
import { tryCatch } from "readium-desktop/utils/tryCatch";

import { Metadata as R2Metadata } from "@r2-shared-js/models/metadata";
import { Contributor } from "@r2-shared-js/models/metadata-contributor";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";
import { Link } from "@r2-shared-js/models/publication-link";

import { IInfo } from "./extract.type";

// Logger
const _filename = "readium-desktop:main/pdf/manifest";
const debug = debug_(_filename);

function pdfDateConverter(dateString: string): Date | undefined {

    if (dateString) {

        const regexp = /(D:|)(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(.*)/.exec(dateString);

        const date = new Date();

        {
            const str = regexp[2];
            if (str) {
                const nb = parseInt(str, 10);
                if (nb) {
                    date.setUTCFullYear(nb);
                }
            }
        }
        {
            const str = regexp[3];
            if (str) {
                const nb = parseInt(str, 10);
                if (nb) {
                    date.setUTCMonth(nb - 1); // ZERO-based!!
                }
            }
        }
        {
            const str = regexp[4];
            if (str) {
                const nb = parseInt(str, 10);
                if (nb) {
                    date.setUTCDate(nb);
                }
            }
        }

        // timezone!
        // D:2022 03 13 13 18 09 +00 '00'
        // D:2021 06 30 04 43 26 +01 '00'
        // D:2022 01 27 18 40 11 Z00 '00'
        // D:2021 02 19 08 47 44 Z
        // D:2004 05 28 09 45 24 -07 '00'
        // D:2003 08 30 15 57 46 Z
        let hoursOffset = 0;
        {
            const str = regexp[8];
            if (str) {
                if (str.startsWith("Z")) {
                    // assumes UTC
                } else if (str.startsWith("+")) {
                    try {
                        const off = parseInt(str.substring(1, 3), 10);
                        if (off) {
                            hoursOffset = -off;
                        }
                    } catch (_e) {
                        // ignore
                    }
                } else if (str.startsWith("-")) {
                    try {
                        const off = parseInt(str.substring(1, 3), 10);
                        if (off) {
                            hoursOffset = off;
                        }
                    } catch (_e) {
                        // ignore
                    }
                }
            }
        }
        {
            const str = regexp[5];
            if (str) {
                const nb = parseInt(str, 10);
                if (nb) {
                    date.setUTCHours(nb + hoursOffset);
                }
            }
        }
        {
            const str = regexp[6];
            if (str) {
                const nb = parseInt(str, 10);
                if (nb) {
                    date.setUTCMinutes(nb);
                }
            }
        }
        {
            const str = regexp[7];
            if (str) {
                const nb = parseInt(str, 10);
                if (nb) {
                    date.setUTCSeconds(nb);
                }
            }
        }

        // console.log("dateString", dateString, date.toISOString(), date.toUTCString());

        return date;
    }

    return undefined;
}

export async function pdfManifest(pdfPath: string, info: IInfo): Promise<R2Publication> {

    const r2Publication = new R2Publication();
    const { name } = path.parse(pdfPath);

    r2Publication.Context = ["https://readium.org/webpub-manifest/context.jsonld"];
    r2Publication.Metadata = new R2Metadata();
    r2Publication.Metadata.Title = name || ""; // required

    if (info) {
        debug(info);

        r2Publication.Metadata.RDFType = "https://schema.org/Book";

        {
            const title = info.Title;
            debug("title", title);

            r2Publication.Metadata.Title = title || name || "";
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

        // {
        //     const producer = info.Producer;
        //     debug("producer", producer);

        //     if (producer) {

        //         const contributor = new Contributor();
        //         contributor.Name = producer;
        //         r2Publication.Metadata.Publisher = [contributor];
        //     }
        // }

        await tryCatch(() => {
            const creationDate = info.CreationDate;
            debug("creationDate", creationDate);

            if (creationDate) {

                const date = pdfDateConverter(creationDate);
                if (date) {
                    r2Publication.Metadata.PublicationDate = date;
                }
            }
        }, _filename);

        await tryCatch(() => {
            const modDate = info.ModDate;
            debug("modificationDate", modDate);

            if (modDate) {

                const date = pdfDateConverter(modDate);
                if (date) {
                    r2Publication.Metadata.Modified = date;
                }
            }
        }, _filename);

        {
            const numberOfPage = info.numberOfPages;
            debug("number of page", numberOfPage);

            if (numberOfPage) {

                r2Publication.Metadata.NumberOfPages = numberOfPage;
            }
        }

    }

    await tryCatch(() => {
        // const pageOne = pages[0];
        // const pageInfoOne = pageOne?.pageInfo?.num === 1 ? pageOne?.pageInfo : undefined;
        // if (pageInfoOne) {

            // const { width, height } = pageInfoOne;
            // const widthRounded = Math.round(width);
            // const heightRounded = Math.round(height);

            const coverName = "cover.png";
            const link = new Link();
            link.AddRel("cover");
            link.Href = coverName;
            link.TypeLink = mimeTypes.png;
            // link.Height = heightRounded;
            // link.Width = widthRounded;

            r2Publication.Resources = [link];
        // }
    }, _filename);

    {
        const pdfName = "publication.pdf";
        const link = new Link();
        link.Title = name;
        link.Href = pdfName;
        link.TypeLink = mimeTypes.pdf;

        r2Publication.Spine = [link];
    }

    return r2Publication;
}
