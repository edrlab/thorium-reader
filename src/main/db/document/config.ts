// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Identifiable } from "readium-desktop/common/models/identifiable";
import { Timestampable } from "readium-desktop/common/models/timestampable";

export interface ConfigDocument<ValueType> extends Identifiable, Timestampable {
    value: ValueType;
}

export interface CatalogEntry {
    title: string;
    tag: string;
}

export interface CatalogConfig {
    entries: CatalogEntry[];
}
