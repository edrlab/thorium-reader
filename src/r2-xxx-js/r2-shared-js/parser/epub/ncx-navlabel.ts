// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { XmlObject, XmlXPathSelector } from "@r2-utils-js/_utils/xml-js-mapper";

import { Audio } from "./ncx-audio";

@XmlObject({
    ncx: "http://www.daisy.org/z3986/2005/ncx/",
})
export class NavLabel {

    // XPATH ROOT: /ncx:ncx/ncx:pageList/ncx:pageTarget/ncx:navLabel
    // XPATH ROOT: /ncx:ncx/ncx:navMap/ncx:navPoint/ncx:navLabel

    @XmlXPathSelector("ncx:text/text()")
    public Text!: string;

    @XmlXPathSelector("ncx:audio")
    public Audio!: Audio;
}
