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
    OpenSearch = "application/opensearchdescription+xml",
    FormUrlEncoded = "application/x-www-form-url-encoded",
    Xhtml = "application/xml+xhtml",
    Html = "text/html",
    Epub = "application/epub+zip",
    Lpf = "application/lpf+zip",
    AudioBook = "application/audiobook+json",
    AudioBookPacked = "application/audiobook+zip",
    AudioBookPackedLcp = "application/audiobook+lcp",
    webpubPacked = "application/webpub+zip",
    Lcp = "application/vnd.readium.lcp.license.v1.0+json",
    Lsd = "application/vnd.readium.license.status.v1.0+json",
}
