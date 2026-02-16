// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { XmlItemType, XmlObject, XmlXPathSelector } from "@r2-utils-js/_utils/xml-js-mapper";

import { DisplayOptionsPlatform } from "./display-options-platform";

@XmlObject()
export class DisplayOptions {

    // XPATH ROOT: /display_options

    @XmlXPathSelector("platform")
    @XmlItemType(DisplayOptionsPlatform)
    public Platforms!: DisplayOptionsPlatform[];

    public ZipPath: string | undefined; // URL already decodeURI()
}
