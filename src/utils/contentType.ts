// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// cf src/utils/mimeTypes.ts
export enum ContentType {
    AtomXml = "application/atom+xml",
    Xml = "application/xml",
    TextXml = "text/xml",
    Json = "application/json",
    JsonLd = "application/ld+json",
    Opds2 = "application/opds+json",
    Divina = "application/divina+json",
    DivinaPacked = "application/divina+zip",
    Opds2Auth = "application/opds-authentication+json",
    Opds2Pub = "application/opds-publication+json",
    Opds2AuthVendorV1_0 = "application/vnd.opds.authentication.v1.0+json",
    OpenSearch = "application/opensearchdescription+xml",
    FormUrlEncoded = "application/x-www-form-url-encoded",
    Xhtml = "application/xhtml+xml",
    Html = "text/html",
    Epub = "application/epub+zip",
    Lpf = "application/lpf+zip",
    AudioBook = "application/audiobook+json",
    webpub = "application/webpub+json",
    AudioBookPacked = "application/audiobook+zip",
    AudioBookPackedLcp = "application/audiobook+lcp",
    webpubPacked = "application/webpub+zip",
    Lcp = "application/vnd.readium.lcp.license.v1.0+json",
    Lsd = "application/vnd.readium.license.status.v1.0+json",
    lcpdf = "application/pdf+lcp",
    pdf = "application/pdf",
    ApiProblem = "application/api-problem+json",
    Opf = "application/oebps-package+xml",
}

export const parseContentType = (RawContentType: string): ContentType | undefined => {

    if (!RawContentType) {
        return undefined;
    }

    const contentTypeArray = RawContentType.replace(/\s/g, "").split(";");

    const contentType = contentTypeArray.reduce<ContentType | undefined>(
        (pv, cv) => pv || Object.values(ContentType).find((v) => v === cv), undefined);
    return contentType;
};

export const contentTypeisXml = (contentType: ContentType | undefined) =>
    contentType && (
        contentType === ContentType.AtomXml
        || contentType === ContentType.Xml
        || contentType === ContentType.TextXml
    );

export const contentTypeisOpds = (contentType: ContentType | undefined) =>
    contentType && (
        contentType === ContentType.Json
        || contentType === ContentType.Opds2
        || contentType === ContentType.Opds2Auth
        || contentType === ContentType.Opds2AuthVendorV1_0
        || contentType === ContentType.Opds2Pub
    );

export const contentTypeisOpdsAuth = (contentType: ContentType | undefined) =>
    contentType === ContentType.Opds2Auth ||
    contentType === ContentType.Opds2AuthVendorV1_0;

export const contentTypeisApiProblem = (contentType: ContentType | undefined) =>
    contentType === ContentType.ApiProblem;
