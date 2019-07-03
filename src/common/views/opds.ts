// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { CoverView } from "./publication";

export interface OpdsFeedView {
    identifier: string;
    title: string;
    url: string;
}

export interface OpdsPublicationView {
    title: string;
    authors: string[];
    publishers?: string[];
    workIdentifier?: string;
    description?: string;
    tags?: string[];
    languages?: string[];
    publishedAt?: string; // ISO8601
    url?: string;
    buyUrl?: string;
    borrowUrl?: string;
    subscribeUrl?: string;
    hasSample?: boolean;
    isFree?: boolean;
    base64OpdsPublication?: string;
    cover?: CoverView;
}

export interface OpdsLinkView {
    title: string;
    url: string;
    publicationCount?: number;
}

export enum OpdsResultType {
    Entry = "entry",
    NavigationFeed = "navigation-feed",
    PublicationFeed = "publication-feed",
    Empty = "empty",
}

export interface OpdsResultView {
    title: string;
    type: OpdsResultType;
    navigation: OpdsLinkView[];
    publications: OpdsPublicationView[];
    searchUrl: string;
}
