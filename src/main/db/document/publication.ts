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
// import { JsonMap } from "readium-desktop/typings/json";

// export interface Resources {

//     r2PublicationJson?: JsonMap;
//     // r2LCPJson?: JsonMap;
//     // r2LSDJson?: JsonMap;
//     // r2OpdsPublicationJson?: JsonMap;

//     // Legacy Base64 data blobs
//     //
//     // r2PublicationBase64?: string;
//     // r2LCPBase64?: string;
//     // r2LSDBase64?: string;
//     // r2OpdsPublicationBase64?: string;
// }

export interface PublicationDocument extends Identifiable, Timestampable {
    // resources: Resources;
    title: string;
    tags?: string[];
    files?: File[];
    coverFile?: File;
    customCover?: CustomCover;

    lcp?: LcpInfo;
    lcpRightsCopies?: number;

    hash: string;

    // specific to publication db migration from pouch-db to redux main state
    doNotMigrateAnymore?: boolean;

    // removed boolean to keep data in database
    removed?: boolean;
}
export type PublicationDocumentWithoutTimestampable = Omit<PublicationDocument, keyof Timestampable>;
