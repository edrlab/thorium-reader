// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END

import { PDFDocumentProxy } from "pdf.js";
import { tryCatch } from "readium-desktop/utils/tryCatch";

import { ILink, TToc } from "../common/pdfReader.type";
import { TdestForPageIndex, TdestObj } from "./pdfjs.type";

export interface IOutline {
    dest?: string | TdestObj[];
    items?: IOutline[];
    title?: string;
}

export function destForPageIndexParse(destRaw: any | any[]): TdestForPageIndex | undefined {

    const destArray = Array.isArray(destRaw) ? destRaw : [destRaw];

    const destForPageIndex = destArray.reduce<TdestForPageIndex | undefined>(
        (pv, cv: TdestForPageIndex) => (typeof cv?.gen === "number" && typeof cv?.num === "number") ? cv : pv,
        undefined,
    );

    return destForPageIndex;
}

// tslint:disable-next-line: max-line-length
export async function tocOutlineItemToLink(outline: IOutline, pdf: PDFDocumentProxy, pageLabels: string[]): Promise<ILink> {

    const link: ILink = {};

    if (outline.dest) {

        const destRaw = outline.dest;
        let destForPageIndex: TdestForPageIndex | undefined;

        if (typeof destRaw === "string") {
            const destArray = await pdf.getDestination(destRaw);

            destForPageIndex = destForPageIndexParse(destArray);

        } else if (typeof destRaw === "object") {
            destForPageIndex = destForPageIndexParse(destRaw);
        }

        if (destForPageIndex) {
            // tslint:disable-next-line: max-line-length
            const page = (await pdf.getPageIndex(destForPageIndex) as unknown as number); // type error should return a number zero based
            const label = pageLabels[page];
            link.Href = label;
        }

    }

    link.Title = typeof outline.title === "string" ? outline.title : "";

    if (Array.isArray(outline.items)) {

        const itemsPromise = outline.items.map(async (item) => tocOutlineItemToLink(item, pdf, pageLabels));
        link.Children = await Promise.all(itemsPromise);
    }

    return link;
}

export async function getToc(pdf: PDFDocumentProxy): Promise<TToc> {

    return await tryCatch(async () => {

        const outline: IOutline[] = await pdf.getOutline();
        const pageLabels = await pdf.getPageLabels();
        if (Array.isArray(outline)) {
            const tocPromise = outline
                .map((item) => tryCatch(() => tocOutlineItemToLink(item, pdf, pageLabels), ""));
            const res = await Promise.all(tocPromise);
            return res.filter((v) => !!v);
        }

        return [];
    }, "src/renderer/reader/pdf/webview/toc.ts") || [];
}
