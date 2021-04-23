// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { LcpInfo } from "readium-desktop/common/models/lcp";
import { JsonMap } from "readium-desktop/typings/json";

import { LocatorExtended } from "@r2-navigator-js/electron/renderer";

import { Identifiable } from "../models/identifiable";

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

    RDFType?: string;
    duration?: number;
    nbOfTracks?: number;

    lcp?: LcpInfo;
    lcpRightsCopies?: number;

    r2PublicationJson: JsonMap;
    // Legacy Base64 data blobs
    // r2PublicationBase64: string;

    lastReadingLocation?: LocatorExtended;
}
