// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { StreamerStatus } from "readium-desktop/common/models/streamer";

export interface StreamerState {
    // Base url of started server
    baseUrl: string;

    status: StreamerStatus;

    openPublicationCounter: { [identifier: string]: number };

    publicationManifestUrl: { [identifier: string]: string };
}
