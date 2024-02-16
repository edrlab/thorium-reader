// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Identifiable } from "readium-desktop/common/models/identifiable";
import { LocatorType } from "readium-desktop/common/models/locator";
import { Locator } from "@r2-navigator-js/electron/common/locator";
import { Timestampable } from "readium-desktop/common/models/timestampable";

export interface LocatorDocument extends Identifiable, Timestampable {
    locator: Locator;
    locatorType: LocatorType;
    publicationIdentifier: string;
    name?: string;
}
