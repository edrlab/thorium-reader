// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { XmlItemType, XmlObject, XmlXPathSelector } from "@r2-utils-js/_utils/xml-js-mapper";

import { DisplayOptionsPlatformProp } from "./display-options-platform-prop";

@XmlObject()
export class DisplayOptionsPlatform {

    // XPATH ROOT: /display_options/platform

    @XmlXPathSelector("@name")
    public Name!: string;

    @XmlXPathSelector("option")
    @XmlItemType(DisplayOptionsPlatformProp)
    public Options!: DisplayOptionsPlatformProp[];
}
