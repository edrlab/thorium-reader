// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import { LocatorExtended } from "@r2-navigator-js/electron/renderer";
import { Locator as R2Locator } from "@r2-shared-js/models/locator";

export const LocatorExtendedWithLocatorOnly = (locator: R2Locator): LocatorExtended => ({
    audioPlaybackInfo: undefined,
    paginationInfo: undefined,
    secondWebViewHref: undefined,
    selectionInfo: undefined,
    selectionIsNew: undefined,
    docInfo: undefined,
    epubPage: undefined,
    headings: undefined,
    locator,
});

export const locatorInitialState: LocatorExtended = LocatorExtendedWithLocatorOnly({
    href: undefined,
    locations: {},
});
