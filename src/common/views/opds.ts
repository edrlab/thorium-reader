// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { OPDSCurrencyEnum } from "r2-opds-js/dist/es6-es2015/src/opds/opds2/opds2-price";

import { Identifiable } from "../models/identifiable";
import { IHttpGetResult } from "../utils/http";

export interface IOpdsFeedView extends Identifiable {
    title: string;
    url: string;
}

export interface IOpdsCoverView {
    coverLinks: IOpdsLinkView[];
    thumbnailLinks: IOpdsLinkView[];
}

export interface IOpdsPublicationView {
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
    entryLinks?: IOpdsLinkView[];
    buyLinks?: IOpdsLinkView[];
    borrowLinks?: IOpdsLinkView[];
    subscribeLinks?: IOpdsLinkView[];
    sampleOrPreviewLinks?: IOpdsLinkView[];
    openAccessLinks?: IOpdsLinkView[];
    cover?: IOpdsCoverView;
}

export interface IOpdsNavigationLinkView {
    title: string;
    subtitle?: string;
    url: string;
    numberOfItems?: number;
}

export interface IOpdsFeedMetadataView {
    numberOfItems?: number;
    itemsPerPage?: number;
    currentPage?: number;
}

export interface IOpdsResultView {
    title: string;
    metadata?: IOpdsFeedMetadataView;
    navigation?: IOpdsNavigationLinkView[];
    publications?: IOpdsPublicationView[];
    links?: IOpdsNavigationLink;
    facets?: IOpdsFacetView[];
    groups?: IOpdsGroupView[];
    auth?: IOpdsAuthView;
}

export interface IOpdsGroupView {
    title: string;
    navigation?: IOpdsNavigationLinkView[];
    publications?: IOpdsPublicationView[];
}

export interface IOpdsFacetView {
    title: string;
    links: IOpdsNavigationLinkView[];
}

export interface IOpdsAuthView {
    logoImageUrl: string;

    labelLogin: string;
    labelPassword: string;

    oauthUrl: string;
    oauthRefreshUrl: string;
}

export interface IOPDSPropertiesView {
    numberOfItems?: number | undefined;
    priceValue?: number | undefined;
    priceCurrency?: OPDSCurrencyEnum | undefined;
    holdTotal?: number | undefined;
    holdPosition?: number | undefined;
    copyTotal?: number | undefined;
    copyAvailable?: number | undefined;
    availabilityState?: string | undefined;
    availabilitySince?: Date | undefined;
    availabilityUntil?: Date | undefined;
}

export interface IOpdsLinkView {
    url: string;
    title?: string | undefined;
    type?: string | undefined;
    properties?: IOPDSPropertiesView;
}

export interface IOpdsNavigationLink {
    next: IOpdsLinkView[];
    previous: IOpdsLinkView[];
    first: IOpdsLinkView[];
    last: IOpdsLinkView[];
    start: IOpdsLinkView[];
    up: IOpdsLinkView[];
    search: IOpdsLinkView[];
    bookshelf: IOpdsLinkView[];
    text: IOpdsLinkView[];
    self: IOpdsLinkView[];
}

export type THttpGetOpdsResultView = IHttpGetResult<string, IOpdsResultView>;
