// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { XmlItemType, XmlObject, XmlXPathSelector } from "@r2-utils-js/_utils/xml-js-mapper";

import { SpineItem } from "./opf-spineitem";

@XmlObject({
    dc: "http://purl.org/dc/elements/1.1/",
    opf: "http://www.idpf.org/2007/opf",
    opf2: "http://openebook.org/namespaces/oeb-package/1.0/",
    xml: "http://www.w3.org/XML/1998/namespace",
})
export class Spine {

    // XPATH ROOT: /opf:package/opf:spine

    @XmlXPathSelector("@id | @xml:id")
    public ID!: string;

    @XmlXPathSelector("@toc")
    public Toc!: string;

    @XmlXPathSelector("@page-progression-direction")
    public PageProgression!: string;

    @XmlXPathSelector("itemref")
    @XmlItemType(SpineItem)
    public Items!: SpineItem[];
}
