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
    httpGet: jest.fn(),
}));
jest.mock("readium-desktop/main/db/repository/publication", () => ({
    PublicationRepository: class PublicationRepository {},
}));

import { TaJsonDeserialize } from "@r2-lcp-js/serializable";
import { OPDSAuthenticationDoc } from "@r2-opds-js/opds/opds2/opds2-authentication-doc";
import { OPDSFeed } from "@r2-opds-js/opds/opds2/opds2";
import { OPDSLink } from "@r2-opds-js/opds/opds2/opds2-link";
import { OPDSGroup } from "@r2-opds-js/opds/opds2/opds2-group";
import type { IHttpGetResult } from "readium-desktop/common/utils/http";
import type { IOpdsResultView } from "readium-desktop/common/views/opds";
import { normalizeOpdsAuthenticationLink, OpdsFeedViewConverter } from "readium-desktop/main/converter/opds";
import { OpdsService } from "readium-desktop/main/services/opds";
import { ContentType } from "readium-desktop/utils/contentType";
import { httpGet } from "readium-desktop/main/network/http";

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

describe("OPDS group self links", () => {
    it.each([undefined, "group.json"])("preserves the title with self href %s", (href) => {
        const group = TaJsonDeserialize({
            metadata: { title: "Publication group" },
            ...(href ? { links: [{ rel: "self", href }] } : {}),
        }, OPDSGroup);
        const view = createConverter().convertOpdsGroupToView(group, baseUrl);

        expect(view.title).toBe("Publication group");
        if (href) {
            expect(view.selfLink.url).toBe("https://example.org/catalog/group.json");
        } else {
            expect(view.selfLink).toBeUndefined();
        }
    });
});

describe("feed conversion", () => {
    it("does not check authentication when listing cards", async () => {
        const document = { identifier: "feed", title: "Catalog", url: baseUrl, createdAt: 0, updatedAt: 0 };
        expect(await createConverter().convertDocumentToView(document)).toMatchObject({ url: baseUrl });
        await new Promise<void>((resolve) => setImmediate(resolve));
        expect(httpGet).not.toHaveBeenCalled();
    });
});

describe("OPDS authentication link hints", () => {
    it("exposes authenticate and both shelf relation forms for login discovery", () => {
        const feed = TaJsonDeserialize({ metadata: { title: "Catalog" }, links: [
            { rel: "authenticate", href: "auth.json", type: authenticationType },
            { rel: "http://opds-spec.org/shelf", href: "loans.json", type: "application/opds+json" },
            { rel: "shelf", href: "shelf.json", type: "application/opds+json" },
        ] }, OPDSFeed);
        const result = createConverter().convertOpdsFeedToView(feed, baseUrl);
        expect(result.links.authenticate.map((link) => link.url)).toEqual(["https://example.org/catalog/auth.json"]);
        expect(result.links.bookshelf.map((link) => link.url)).toEqual([
            "https://example.org/catalog/loans.json", "https://example.org/catalog/shelf.json",
        ]);
    });
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

        expect(result.isPublication).toBeUndefined();
        expect(result.title).toBe(effectiveUrl);
        expect(convertOpdsFeedToView.mock.calls[0][1]).toBe(effectiveUrl);
    });
});

describe("OPDS publication responses", () => {
    it.each([ContentType.Opds2, ContentType.Opds2Pub])("identifies a standalone publication served as %s", async (contentType) => {
        const service = new OpdsService();
        Object.assign(service, { opdsFeedViewConverter: createConverter() });
        const result = await service.opdsRequestTransformer({
            contentType, isFailure: false, isSuccess: true, url: baseUrl, responseUrl: baseUrl,
            response: { json: async () => ({ metadata: { title: "Held publication" }, links: [{
                href: "booking", rel: "http://opds-spec.org/acquisition/borrow", type: ContentType.Opds2Pub,
                properties: { availability: { state: "reserved" } },
            }] }) },
        } as unknown as IHttpGetResult<IOpdsResultView>);
        expect(result.isPublication).toBe(true);
        expect(result.publications[0].borrowLinks[0].properties.availabilityState).toBe("reserved");
    });
});

describe("OPDS hold cancellation properties", () => {
    it.each([
        [{ cancellable: true }, true],
        [{ actions: { cancellable: true } }, true],
        [{ cancellable: false, actions: { cancellable: true } }, true],
        [{ cancellable: true, actions: { cancellable: false } }, true],
        [{ actions: { cancellable: false } }, false],
        [{ actions: { cancellable: "true" } }, false],
        [{ actions: "cancellable" }, false],
        [{ actions: [] }, false],
        [{ actions: null }, false],
        [{}, false],
    ])("normalizes standard and CantookStation cancellation flags: %p", (flags, expected) => {
        const link = TaJsonDeserialize({
            type: "application/opds-publication+json",
            rel: "http://opds-spec.org/acquisition/borrow",
            href: "https://banq.pretnumerique.ca/v1/bookings/hold.opds2",
            properties: {
                availability: { state: "reserved" },
                holds: { position: 52, total: 52 },
                ...flags,
            },
        }, OPDSLink);
        const result = createConverter().convertOpdsPropertiesToView(link.Properties, baseUrl);
        expect(result.cancellable).toBe(expected);
        expect(result.availabilityState).toBe("reserved");
        expect(result.holdPosition).toBe(52);
    });
});


describe("inline Basic authentication", () => {
    it("returns form metadata for an authentication document without opening a window", async () => {
        const doc = {
            id: "https://example.org/auth", title: "Sign in",
            authentication: [{ type: "http://opds-spec.org/auth/basic", labels: { login: "Card", password: "PIN" } }],
            links: [{ rel: "logo", href: "logo.png" }, { rel: "help", href: "/help" }, { rel: "register", href: "/register" }],
        };
        const converter = createConverter();
        const view = converter.convertOpdsAuthToView(TaJsonDeserialize(doc, OPDSAuthenticationDoc), baseUrl);
        expect(view.auth).toMatchObject({
            credentialsUrl: baseUrl, labelLogin: "Card", labelPassword: "PIN",
            logoImageUrl: "https://example.org/catalog/logo.png",
            helpUrls: ["https://example.org/help"], registerUrl: "https://example.org/register",
        });
        const service = new OpdsService();
        Object.assign(service, { opdsFeedViewConverter: converter });
        const dispatch = jest.spyOn(service as unknown as { dispatchAuthenticationProcess: () => void }, "dispatchAuthenticationProcess");
        const result = await service.opdsRequestTransformer({
            url: baseUrl, isSuccess: false, isFailure: true, statusCode: 401,
            contentType: authenticationType, response: { json: async () => doc },
        } as unknown as IHttpGetResult<IOpdsResultView>);
        expect(result.auth.credentialsUrl).toBe(baseUrl);
        expect(dispatch).not.toHaveBeenCalled();
    });

    it("returns a form for a plain Basic challenge using the effective URL", async () => {
        const service = new OpdsService();
        const dispatch = jest.spyOn(service as unknown as { sendWwwAuthenticationToAuthenticationProcess: () => void }, "sendWwwAuthenticationToAuthenticationProcess");
        const result = await service.opdsRequestTransformer({
            url: baseUrl, responseUrl: "https://example.org/protected", isSuccess: false, isFailure: true,
            statusCode: 401, contentType: "text/plain",
            response: { headers: { get: () => 'Basic realm="Catalog"' } },
        } as unknown as IHttpGetResult<IOpdsResultView>);
        expect(result.auth.credentialsUrl).toBe("https://example.org/protected");
        expect(dispatch).not.toHaveBeenCalled();
    });

    it("keeps SAML documents out of the inline flow", () => {
        const view = createConverter().convertOpdsAuthToView(TaJsonDeserialize({
            id: baseUrl, title: "Browser", authentication: [{ type: "http://librarysimplified.org/authtype/SAML-2.0" }],
        }, OPDSAuthenticationDoc), baseUrl);
        expect(view.auth.credentialsUrl).toBeUndefined();
    });
});


it.each(["http://opds-spec.org/auth/local", "http://opds-spec.org/auth/oauth/password"])(
    "exposes inline credentials and endpoints for %s", type => {
        const view = createConverter().convertOpdsAuthToView(TaJsonDeserialize({
            id: "provider", title: "Login", authentication: [{ type,
                labels: { login: "Card", password: "PIN" },
                links: [{ rel: "authenticate", href: "token" }, { rel: "refresh", href: "refresh" }],
            }],
        }, OPDSAuthenticationDoc), baseUrl);
        expect(view.auth).toMatchObject({ authenticationType: type, credentialsUrl: baseUrl,
            authenticationId: "provider", labelLogin: "Card", labelPassword: "PIN",
            oauthUrl: "https://example.org/catalog/token", oauthRefreshUrl: "https://example.org/catalog/refresh",
        });
    },
);


it.each([
    ["http://opds-spec.org/auth/oauth/implicit", "http://opds-spec.org/auth/oauth/implicit"],
    ["http://opds-spec.org/auth/oauth/authorization-code-pkce", "http://opds-spec.org/auth/oauth/authorization-code-pkce"],
    ["http://opds-spec.org/auth/oauth/code", "http://opds-spec.org/auth/oauth/authorization-code-pkce"],
])(
    "renders %s as an external authentication result without starting a modal", async (type, expectedType) => {
        const service = new OpdsService();
        Object.assign(service, { opdsFeedViewConverter: createConverter() });
        const modal = jest.spyOn(service as unknown as { dispatchAuthenticationProcess: () => void }, "dispatchAuthenticationProcess");
        const result = await service.opdsRequestTransformer({
            url: baseUrl, responseUrl: baseUrl, isSuccess: false, isFailure: true, statusCode: 401,
            contentType: authenticationType, response: { json: async () => ({
                id: "provider", title: "Sign in", authentication: [{ type, links: [{ rel: "authenticate", href: "/authorize" }] }],
            }) },
        } as unknown as IHttpGetResult<IOpdsResultView>);
        expect(result.auth).toMatchObject({ external: true, authenticationType: expectedType, credentialsUrl: baseUrl,
            oauthUrl: "https://example.org/authorize" });
        expect(modal).not.toHaveBeenCalled();
    },
);
