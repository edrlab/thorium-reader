// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Download } from "readium-desktop/common/models/download";
import { Publication } from "readium-desktop/common/models/publication";

export interface PublicationDownloadState {
    // Download identifier => Publication identifier
    downloadIdentifierToPublication: { [identifier: string]: Publication };

    // Publication identifiers => Download identifiers
    publicationIdentifierToDownloads: { [identifier: string]: Download[] };

    // Progress of publication download
    publicationDownloadProgress: { [identifier: string]: number };

    // Last time a publication download has been updated
    lastUpdatedDate: number;
}
