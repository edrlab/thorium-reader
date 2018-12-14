// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { CustomCover } from "readium-desktop/common/models/custom-cover";

export interface CoverView {
    url: string;
}

export interface CustomCoverView {
    topColor: string;
    bottomColor: string;
}

export interface PublicationView {
    identifier: string;
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
}
