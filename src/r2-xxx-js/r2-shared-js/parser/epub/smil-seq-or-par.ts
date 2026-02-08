// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import {
    XmlDiscriminatorProperty, XmlObject, XmlXPathSelector,
} from "@r2-utils-js/_utils/xml-js-mapper";

@XmlObject({
    epub: "http://www.idpf.org/2007/ops",
    smil: "http://www.w3.org/ns/SMIL",
    smil2: "http://www.w3.org/2001/SMIL20/",
    xml: "http://www.w3.org/XML/1998/namespace",
})
@XmlDiscriminatorProperty("localName")
export class SeqOrPar {
    // protected localName: string;

    @XmlXPathSelector("@epub:type")
    public EpubType!: string;

    @XmlXPathSelector("@id | @xml:id")
    public ID!: string;

    @XmlXPathSelector("@dur")
    public Duration!: string;

    // @XmlXPathSelector("@fill")
    // public Fill!: string;

    // @XmlXPathSelector("@class")
    // public Class!: string;

    @XmlXPathSelector("@customTest")
    public CustomTest!: string;

    @XmlXPathSelector("@system-required")
    public SystemRequired!: string;

    @XmlXPathSelector("@class")
    public Class!: string;
}
