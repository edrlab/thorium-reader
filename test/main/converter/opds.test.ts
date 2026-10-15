// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { describe, expect, it, jest } from "@jest/globals";

jest.mock("inversify", () => ({
    inject: () => (): void => undefined,
    injectable:
        () =>
        <T>(target: T): T =>
            target,
}));
jest.mock("readium-desktop/main/network/http", () => ({
    getAuthenticationToken: jest.fn(),
}));
jest.mock("readium-desktop/main/db/repository/publication", () => ({
    PublicationRepository: class PublicationRepository {},
}));

import { TaJsonDeserialize } from "@r2-lcp-js/serializable";
import { OPDSFeed } from "@r2-opds-js/opds/opds2/opds2";
import { OPDSLink } from "@r2-opds-js/opds/opds2/opds2-link";
import type { IHttpGetResult } from "readium-desktop/common/utils/http";
import type { IOpdsResultView } from "readium-desktop/common/views/opds";
import { normalizeOpdsAuthenticationLink, OpdsFeedViewConverter } from "readium-desktop/main/converter/opds";
import { OpdsService } from "readium-desktop/main/services/opds";
import { ContentType } from "readium-desktop/utils/contentType";

const baseUrl = "https://example.org/catalog/feed.json";
const authenticationType = "application/opds-authentication+json";

const authenticate = (href: string, title?: string) => ({
    href,
    type: authenticationType,
    ...(title ? { title } : {}),
});

const properties = (href: string, title?: string) => ({
    authenticate: authenticate(href, title),
});

const createConverter = () => {
    const converter = new OpdsFeedViewConverter();
    Object.assign(converter, {
        publicationRepository: {
            findByOpdsPublication: (): unknown[] => [],
        },
        store: {
            getState: () => ({
                i18n: {
                    locale: "en",
                },
            }),
        },
    });
    return converter;
};

describe("OPDS authentication link hints", () => {
    it("normalizes absolute and relative authentication document links", () => {
        expect(
            normalizeOpdsAuthenticationLink(
                {
                    href: "auth.json",
                    title: "Sign in",
                    type: authenticationType,
                },
                baseUrl,
            ),
        ).toEqual({
            url: "https://example.org/catalog/auth.json",
            title: "Sign in",
            type: authenticationType,
        });

        expect(
            normalizeOpdsAuthenticationLink(
                {
                    href: "https://auth.example.net/document.json",
                },
                baseUrl,
            ),
        ).toEqual({
            url: "https://auth.example.net/document.json",
        });
    });

    it.each([
        undefined,
        null,
        "auth.json",
        [],
        {},
        { href: "" },
        { href: "   " },
        { href: "auth.json", type: 42 },
        { href: "auth.json", title: false },
        { href: "relative.json" },
    ])("ignores a malformed or unusable hint: %p", (hint) => {
        const unusableBaseUrl =
            hint && typeof hint === "object" && "href" in hint && hint.href === "relative.json" ? "not a URL" : baseUrl;
        expect(normalizeOpdsAuthenticationLink(hint, unusableBaseUrl)).toBeUndefined();
    });

    it("preserves deserialized hints across feed conversion paths", () => {
        const feed = TaJsonDeserialize(
            {
                metadata: {
                    title: "Catalog",
                },
                links: [
                    {
                        href: "page-2.json",
                        rel: "next",
                        properties: properties("auth-pagination.json"),
                    },
                    {
                        href: "plain.json",
                        rel: "previous",
                    },
                ],
                navigation: [
                    {
                        href: "navigation.json",
                        title: "Navigation",
                        properties: properties("auth-navigation.json"),
                    },
                ],
                facets: [
                    {
                        metadata: {
                            title: "Facet",
                        },
                        links: [
                            {
                                href: "facet.json",
                                title: "Facet link",
                                properties: properties("auth-facet.json"),
                            },
                        ],
                    },
                ],
                groups: [
                    {
                        metadata: {
                            title: "Group",
                            numberOfItems: 7,
                        },
                        links: [
                            {
                                href: "group.json",
                                rel: "self",
                                properties: {
                                    ...properties("auth-group.json"),
                                    numberOfItems: 99,
                                    price: {
                                        currency: "EUR",
                                        value: 12,
                                    },
                                },
                            },
                        ],
                    },
                ],
                publications: [
                    {
                        images: [],
                        metadata: {
                            identifier: "publication-id",
                            title: "Publication",
                        },
                        links: [
                            {
                                href: "publication.json",
                                rel: "self",
                                type: "application/opds-publication+json",
                                properties: properties("auth-publication.json"),
                            },
                            {
                                href: "borrow.epub",
                                rel: "http://opds-spec.org/acquisition/borrow",
                                type: "application/epub+zip",
                                properties: properties("auth-borrow.json"),
                            },
                            {
                                href: "/downloads/book.epub",
                                rel: "http://opds-spec.org/acquisition",
                                type: "application/epub+zip",
                                properties: properties("auth-acquisition.json", "Authenticate"),
                            },
                        ],
                    },
                ],
            },
            OPDSFeed,
        );

        expect(feed.Navigation[0].Properties.AdditionalJSON.authenticate).toEqual(authenticate("auth-navigation.json"));

        const view = createConverter().convertOpdsFeedToView(feed, baseUrl);

        expect(view.navigation[0].properties.authenticate.url).toBe("https://example.org/catalog/auth-navigation.json");
        expect(view.links.next[0].properties.authenticate.url).toBe("https://example.org/catalog/auth-pagination.json");
        expect(view.links.previous[0]).toEqual({
            properties: undefined,
            rel: "previous",
            title: undefined,
            type: undefined,
            url: "https://example.org/catalog/plain.json",
        });
        expect(view.facets[0].links[0].properties.authenticate.url).toBe("https://example.org/catalog/auth-facet.json");
        expect(view.groups[0].selfLink.properties).toMatchObject({
            authenticate: {
                type: authenticationType,
                url: "https://example.org/catalog/auth-group.json",
            },
            numberOfItems: 7,
            priceCurrency: "EUR",
            priceValue: 12,
        });
        expect(view.publications[0].selfLink.properties.authenticate.url).toBe(
            "https://example.org/catalog/auth-publication.json",
        );
        expect(view.publications[0].borrowLinks[0].properties.authenticate.url).toBe(
            "https://example.org/catalog/auth-borrow.json",
        );
        expect(view.publications[0].openAccessLinks[0]).toMatchObject({
            properties: {
                authenticate: {
                    title: "Authenticate",
                    type: authenticationType,
                    url: "https://example.org/catalog/auth-acquisition.json",
                },
            },
            url: "https://example.org/downloads/book.epub",
        });
    });

    it("uses the effective containing-document URL after a redirect", () => {
        const link = TaJsonDeserialize(
            {
                href: "/downloads/book.epub",
                properties: properties("auth.json"),
                type: "application/epub+zip",
            },
            OPDSLink,
        );

        const view = createConverter().convertLinkToView(link, "https://example.org/redirected/catalog.json");

        expect(view.url).toBe("https://example.org/downloads/book.epub");
        expect(view.properties.authenticate.url).toBe("https://example.org/redirected/auth.json");
    });

    it("passes the effective response URL to feed conversion", async () => {
        const effectiveUrl = "https://example.org/redirected/catalog.json";
        const convertOpdsFeedToView = jest.fn((_feed: OPDSFeed, receivedBaseUrl: string): IOpdsResultView => ({
            title: receivedBaseUrl,
        }));
        const service = new OpdsService();
        Object.assign(service, {
            opdsFeedViewConverter: {
                convertOpdsFeedToView,
            },
        });

        const result = await service.opdsRequestTransformer({
            contentType: ContentType.Opds2,
            isFailure: false,
            isSuccess: true,
            response: {
                json: async () => ({
                    metadata: {
                        title: "Catalog",
                    },
                    links: [
                        {
                            href: "catalog.json",
                            rel: "self",
                        },
                    ],
                    navigation: [
                        {
                            href: "navigation.json",
                        },
                    ],
                }),
            },
            responseUrl: effectiveUrl,
            url: "https://example.org/original.json",
        } as unknown as IHttpGetResult<IOpdsResultView>);

        expect(result.title).toBe(effectiveUrl);
        expect(convertOpdsFeedToView.mock.calls[0][1]).toBe(effectiveUrl);
    });
});
