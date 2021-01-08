// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { StatusEnum } from "@r2-lcp-js/parser/epub/lsd";

export interface LsdInfo {
    statusUrl: string;
    lsdStatus?: LsdStatus;

    r2LSDBase64: string;
}

export interface LcpRights {
    print?: number;
    copy?: number;
    start?: string; // Date.toISOString()
    end?: string; // Date.toISOString()
}

export interface LcpInfo {
    provider: string;
    issued: string; // Date.toISOString()
    updated?: string; // Date.toISOString()
    lsd?: LsdInfo;
    rights: LcpRights;
    textHint: string;
    urlHint?: {
        href: string | undefined,
        title?: string,
        type?: string,
    };

    r2LCPBase64: string;
}

export interface LsdEvent {
    type: string;
    name: string;
    id: string;
    timeStamp: string; // Date.toISOString()
}

export interface LsdLink {
    type: string;
    rel: string;
    href: string;
    length?: number;
    title?: string;
    templated?: boolean;
    profile?: string;
    hash?: string;
}

export interface LsdStatus {
    events?: LsdEvent[];
    id: string;
    links: LsdLink[];
    message: string;
    status: StatusEnum;
    updated: {
        license: string; // Date.toISOString()
        status: string; // Date.toISOString()
    };
}
