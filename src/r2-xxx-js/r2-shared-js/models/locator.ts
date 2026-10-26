// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

/** Readium Locator model: https://readium.org/architecture/models/locators/ */
export interface Locator {
    /** URI of the resource, without a fragment identifier. */
    href: string;

    /** Media type of the resource. */
    type: string;

    /** Title of the chapter or section relevant to this locator. */
    title?: string;

    /** Alternative expressions of the location. */
    locations?: LocatorLocations;

    /** Textual context of the locator. */
    text?: LocatorText;
}

export interface LocatorText {
    before?: string;
    highlight?: string;
    after?: string;

    // Legacy Readium extensions for unnormalized DOM text.
    beforeRaw?: string;
    highlightRaw?: string;
    afterRaw?: string;
}

export interface LocatorLocations {
    /** Media-specific fragment identifiers, without the leading #. */
    fragments?: string[];

    /** Progression within the resource, between 0 and 1. */
    progression?: number;

    /** One-based integer index in the publication. */
    position?: number;

    /** Progression within the publication, between 0 and 1. */
    totalProgression?: number;

    /** Registered HTML location extension. */
    cssSelector?: string;

    // Legacy EPUB CFI extension, retained for existing locators.
    cfi?: string;

    /** Additional location extensions must use a URI as their key. */
    [extension: `${string}:${string}`]: unknown;
}
