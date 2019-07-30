// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import {
    Reader, ReaderConfig, ReaderMode,
} from "readium-desktop/common/models/reader";

export interface ReaderStateReader {
    reader: Reader;
}

export interface ReaderStateMode {
    mode: ReaderMode;
}

export interface ReaderStateConfig {

    // Config for all readers
    config: ReaderConfig;
}

export interface ReaderState extends ReaderStateMode, ReaderStateConfig {
    // Base url of started server
    readers: { [identifier: string]: Reader };
}
