// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export interface Locator {
    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/architecture/blob/f90b440dc3aa63c59981e3e46a7db7b8a545c613/schema/locator.schema.json#L7
    href: string;

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/architecture/blob/f90b440dc3aa63c59981e3e46a7db7b8a545c613/schema/locator.schema.json#L16
    title?: string;

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/architecture/blob/f90b440dc3aa63c59981e3e46a7db7b8a545c613/schema/locator.schema.json#L39
    text?: LocatorText;

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/architecture/blob/f90b440dc3aa63c59981e3e46a7db7b8a545c613/schema/locator.schema.json#L20
    locations: LocatorLocations;

    // TODO
    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/architecture/blob/f90b440dc3aa63c59981e3e46a7db7b8a545c613/schema/locator.schema.json#L12
    // type: string;
}

export interface LocatorText {
    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/architecture/blob/f90b440dc3aa63c59981e3e46a7db7b8a545c613/schema/locator.schema.json#L42
    before?: string;

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/architecture/blob/f90b440dc3aa63c59981e3e46a7db7b8a545c613/schema/locator.schema.json#L46
    highlight?: string;

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/architecture/blob/f90b440dc3aa63c59981e3e46a7db7b8a545c613/schema/locator.schema.json#L50
    after?: string;

    beforeRaw?: string;
    highlightRaw?: string;
    afterRaw?: string;
}

export interface LocatorLocations {

    // TODO
    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/architecture/blob/f90b440dc3aa63c59981e3e46a7db7b8a545c613/schema/locator.schema.json#L23
    // fragment?: string;
    cfi?: string;
    cssSelector?: string;

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/architecture/blob/f90b440dc3aa63c59981e3e46a7db7b8a545c613/schema/locator.schema.json#L32
    position?: number;

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/architecture/blob/f90b440dc3aa63c59981e3e46a7db7b8a545c613/schema/locator.schema.json#L27
    progression?: number;
}
