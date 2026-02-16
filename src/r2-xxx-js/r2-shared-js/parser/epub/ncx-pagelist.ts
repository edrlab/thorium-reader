// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { XmlItemType, XmlObject, XmlXPathSelector } from "@r2-utils-js/_utils/xml-js-mapper";

import { PageTarget } from "./ncx-pagetarget";

@XmlObject({
    ncx: "http://www.daisy.org/z3986/2005/ncx/",
    xml: "http://www.w3.org/XML/1998/namespace",
})
export class PageList {

    // XPATH ROOT: /ncx:ncx/ncx:pageList

    @XmlXPathSelector("ncx:pageTarget")
    @XmlItemType(PageTarget)
    public PageTarget!: PageTarget[];

    @XmlXPathSelector("@class")
    public Class!: string;

    @XmlXPathSelector("@id | @xml:id")
    public ID!: string;
}
