// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export interface Locator {
    href: string;
    title?: string;
    text?: LocatorText;
    locations: LocatorLocations;
}

export interface LocatorText {
    before?: string;
    highlight?: string;
    after?: string;
}

export interface LocatorLocations {
    cfi?: string;
    cssSelector?: string;
    position?: number;
    progression?: number;
}
