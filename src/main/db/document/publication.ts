// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { CustomCover } from "readium-desktop/common/models/custom-cover";
import { File } from "readium-desktop/common/models/file";
import { Identifiable } from "readium-desktop/common/models/identifiable";
import { LcpInfo } from "readium-desktop/common/models/lcp";
import { Timestampable } from "readium-desktop/common/models/timestampable";
import { IHttpGetResult } from "readium-desktop/common/utils/http";

interface Resources {
    filePublication: string;
    opdsPublication: string;
}

export interface PublicationDocument extends Identifiable, Timestampable {
    resources: Resources;
    opdsPublication: any;
    title: string;
    tags?: string[];
    files?: File[];
    coverFile?: File;
    customCover?: CustomCover;
    lcp?: LcpInfo;
    crc32: string;
}

export type THttpGetPublicationDocument = IHttpGetResult<string, PublicationDocument>;
