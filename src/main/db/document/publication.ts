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

    // when true, was migrated from PouchDB (Sqlite3 / Leveldown database storage adapters) to Redux state (with JSON serialization)
    doNotMigrateAnymore?: boolean;

    // TODO: change this design in Thorium 1.8+ to avoid unbounded database growth when deleting publications
    // when true, was removed via Thorium 1.7+ but data is preserved here to avoid re-migration from PouchDB (Sqlite3 / Leveldown database storage adapters) to Redux state (with JSON serialization) at subsequent app launches
    removedButPreservedToAvoidReMigration?: boolean;
}
export type PublicationDocumentWithoutTimestampable = Omit<PublicationDocument, keyof Timestampable>;
