// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { XmlObject, XmlXPathSelector } from "@r2-utils-js/_utils/xml-js-mapper";

@XmlObject()
export class DisplayOptionsPlatformProp {

    // XPATH ROOT: /display_options/platform/option

    @XmlXPathSelector("@name")
    public Name!: string;

    @XmlXPathSelector("text()")
    public Value!: string;
}
