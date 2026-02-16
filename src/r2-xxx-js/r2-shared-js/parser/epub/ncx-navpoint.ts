// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { XmlItemType, XmlObject, XmlXPathSelector } from "@r2-utils-js/_utils/xml-js-mapper";

import { Content } from "./ncx-content";
import { NavLabel } from "./ncx-navlabel";

@XmlObject({
    ncx: "http://www.daisy.org/z3986/2005/ncx/",
    xml: "http://www.w3.org/XML/1998/namespace",
})
export class NavPoint {

    // XPATH ROOT: /ncx:ncx/ncx:navMap/ncx:navPoint

    @XmlXPathSelector("ncx:navPoint")
    @XmlItemType(NavPoint)
    public Points!: NavPoint[];

    @XmlXPathSelector("ncx:navLabel")
    public NavLabel!: NavLabel;

    @XmlXPathSelector("ncx:content")
    public Content!: Content;

    @XmlXPathSelector("@playOrder")
    public PlayerOrder!: number;

    @XmlXPathSelector("@id | @xml:id")
    public ID!: string;
}
