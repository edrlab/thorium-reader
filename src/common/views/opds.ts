// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { OPDSLink } from "r2-opds-js/dist/es6-es2015/src/opds/opds2/opds2-link";
import { OPDSMetadata } from "r2-opds-js/dist/es6-es2015/src/opds/opds2/opds2-metadata";

import { IHttpGetResult } from "../utils/http";
import { CoverView } from "./publication";

export interface OpdsFeedView {
    identifier: string;
    title: string;
    url: string;
}

export interface IOpdsPublicationView {
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

export interface IOpdsNavigationLinkView {
    title: string;
    subtitle?: string;
    url: string;
    numberOfItems?: number;
}

export interface IOpdsResultView extends
    Partial<Pick<OPDSMetadata, "NumberOfItems" | "ItemsPerPage" | "CurrentPage">>,
    Pick<OPDSMetadata, "Title"> {
    navigation?: IOpdsNavigationLinkView[];
    publications?: IOpdsPublicationView[];
    links?: IOpdsNavigationLink;
}

type TOpdsLinkViewSimplifiedTitle = Partial<Pick<OPDSLink, "Title">>;
export type TOpdsLinkViewSimplified = Pick<OPDSLink, "Href" | "TypeLink"> & TOpdsLinkViewSimplifiedTitle;

export interface IOpdsNavigationLink {
    next: TOpdsLinkViewSimplified[];
    previous: TOpdsLinkViewSimplified[];
    first: TOpdsLinkViewSimplified[];
    last: TOpdsLinkViewSimplified[];
    start: TOpdsLinkViewSimplified[];
    up: TOpdsLinkViewSimplified[];
    search: TOpdsLinkViewSimplified[];
    bookshelf: TOpdsLinkViewSimplified[];
    text: TOpdsLinkViewSimplified[];
}

export type THttpGetOpdsResultView = IHttpGetResult<string, IOpdsResultView>;
