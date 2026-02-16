// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { XmlItemType, XmlObject, XmlXPathSelector } from "@r2-utils-js/_utils/xml-js-mapper";

import { NavPoint } from "./ncx-navpoint";
import { PageList } from "./ncx-pagelist";

@XmlObject({
    ncx: "http://www.daisy.org/z3986/2005/ncx/",
})
export class NCX {

    // XPATH ROOT: /ncx:ncx

    @XmlXPathSelector("ncx:navMap/ncx:navPoint")
    @XmlItemType(NavPoint)
    public Points!: NavPoint[];

    @XmlXPathSelector("ncx:pageList")
    public PageList!: PageList;

    public ZipPath!: string; // URL already decodeURI()
}
