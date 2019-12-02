// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Identifiable } from "../models/identifiable";
import { IHttpGetResult } from "../utils/http";
import { CoverView } from "./publication";

export interface OpdsFeedView extends Identifiable {
    title: string;
    url: string;
}

export interface OpdsPublicationView {
    baseUrl: string;
    r2OpdsPublicationBase64?: string;
    title: string;
    authors: string[];
    publishers?: string[];
    workIdentifier?: string;
    description?: string;
    tags?: string[];
    languages?: string[];
    publishedAt?: string; // ISO8601
    entryUrl?: string;
    buyUrl?: string;
    borrowUrl?: string;
    subscribeUrl?: string;
    sampleOrPreviewUrl?: string;
    openAccessUrl?: string;
    cover?: CoverView;
}

export interface OpdsLinkView {
    title: string;
    subtitle?: string;
    url: string;
    numberOfItems?: number;
}

export interface OpdsGroupView {
    title: string;
    navigation?: OpdsLinkView[];
    opdsPublicationViews?: OpdsPublicationView[];
}

export enum OpdsResultType {
    // Entry = "entry",
    NavigationFeed = "navigation-feed",
    PublicationFeed = "publication-feed",
    MixedFeed = "mixed-feed",
    Empty = "empty",

    Auth = "auth",
}

export interface OpdsAuthView {
    logoImageUrl: string;

    labelLogin: string;
    labelPassword: string;

    oauthUrl: string;
    oauthRefreshUrl: string;
}

export interface OpdsResultView {
    type: OpdsResultType;

    title: string;

    navigation?: OpdsLinkView[];
    opdsPublicationViews?: OpdsPublicationView[];
    groups?: OpdsGroupView[];

    urls: OpdsResultUrls;
    page?: OpdsResultPageInfos;

    auth?: OpdsAuthView;
}

export interface OpdsResultUrls {
    nextPage?: string;
    previousPage?: string;
    firstPage?: string;
    lastPage?: string;
    search?: string;
    shelf?: string;
}

export interface OpdsResultPageInfos {
    numberOfItems: number;
    itemsPerPage: number;
}

export type THttpGetOpdsResultView = IHttpGetResult<string, OpdsResultView>;
