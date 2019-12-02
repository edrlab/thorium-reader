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
    start?: Date;
    end?: Date;
}

export interface LcpInfo {
    provider: string;
    issued: Date;
    updated?: Date;
    lsd?: LsdInfo;
    rights: LcpRights;

    r2LCPBase64: string;
}

export interface DeviceConfig {
    [key: string]: any; // TODO any?!
}

export interface LsdStatus {
    events: any[]; // TODO any?!
    id: string;
    links: any[]; // TODO any?!
    message: string;
    status: StatusEnum;
    updated: {
        license: string;
        status: string;
    };
}
