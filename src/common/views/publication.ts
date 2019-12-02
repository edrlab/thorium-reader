// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { LcpInfo } from "readium-desktop/common/models/lcp";

import { Identifiable } from "../models/identifiable";

// import { Metadata } from "@r2-shared-js/models/metadata";

export interface CoverView {
    coverUrl?: string;
    thumbnailUrl?: string;
}

export interface CustomCoverView {
    topColor: string;
    bottomColor: string;
}

export interface PublicationView extends Identifiable {
    title: string;
    authors: string[];
    publishers?: string[];
    workIdentifier?: string;
    description?: string;
    tags?: string[];
    languages?: string[];
    publishedAt?: string; // ISO8601
    cover?: CoverView;
    customCover?: CustomCoverView;

    // doc?: Metadata; // TODO why "doc"?? ... anyway, unused code!

    lcp?: LcpInfo;
    lcpRightsCopies?: number;

    r2PublicationBase64: string;
}
