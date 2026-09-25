// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { describe, expect, it, test } from "@jest/globals";
import { IOpdsLinkView, IOpdsPublicationView } from "readium-desktop/common/views/opds";
import { attachLocalBookshelfPublication } from "readium-desktop/renderer/library/opds/localBookshelfPublication";

const createPublication = (
    links: Partial<
        Pick<IOpdsPublicationView, "openAccessLinks" | "sampleOrPreviewLinks" | "buyLinks" | "borrowLinks">
    > = {},
): IOpdsPublicationView => ({
    baseUrl: "https://example.com/catalog",
    documentTitle: "A publication",
    authorsLangString: [],
    numberOfPages: 0,
    catalogLinkView: [],
    workIdentifier: "work-id",
    selfLink: {
        url: "https://example.com/publication.json",
    },
    ...links,
});

describe("attachLocalBookshelfPublication", () => {
    const importedLink: IOpdsLinkView = {
        url: "https://example.com/publication.epub",
        type: "application/epub+zip",
    };

    test.each(["openAccessLinks", "sampleOrPreviewLinks", "buyLinks", "borrowLinks"] as const)(
        "updates a matching %s acquisition link",
        (propertyName) => {
            const unrelatedLink: IOpdsLinkView = {
                url: "https://example.com/other.epub",
                type: "application/epub+zip",
            };
            const publication = createPublication({
                [propertyName]: [unrelatedLink, importedLink],
            });

            const updatedPublication = attachLocalBookshelfPublication(
                publication,
                importedLink,
                "local-publication-id",
            );

            expect(updatedPublication).not.toBe(publication);
            expect(updatedPublication[propertyName]?.[0]).toBe(unrelatedLink);
            expect(updatedPublication[propertyName]?.[1]).toEqual({
                ...importedLink,
                localBookshelfPublicationId: "local-publication-id",
            });
            expect(publication[propertyName]?.[1].localBookshelfPublicationId).toBeUndefined();
        },
    );

    it("does not update a link whose media type differs", () => {
        const publication = createPublication({
            openAccessLinks: [
                {
                    ...importedLink,
                    type: "application/pdf",
                },
            ],
        });

        expect(attachLocalBookshelfPublication(publication, importedLink, "local-publication-id")).toBe(publication);
    });
});
