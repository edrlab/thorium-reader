// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Downloadable } from "./downloadable";
import { Identifiable } from "./identifiable";

export interface Download extends Downloadable, Identifiable {
    // Url of the source file to download
    srcUrl: string;

    // Url of the downloaded
    dstPath: string;

    // Error message if status is failed
    error?: string;
}
