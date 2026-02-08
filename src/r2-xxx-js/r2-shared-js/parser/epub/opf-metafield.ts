// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { XmlObject, XmlXPathSelector } from "@r2-utils-js/_utils/xml-js-mapper";

@XmlObject({
    dc: "http://purl.org/dc/elements/1.1/",
    opf: "http://www.idpf.org/2007/opf",
    opf2: "http://openebook.org/namespaces/oeb-package/1.0/",
    xml: "http://www.w3.org/XML/1998/namespace",
})
export class Metafield {

    // XPATH ROOT: /opf:package/opf:metadata/opf:meta

    @XmlXPathSelector("text()")
    public Data!: string;

    @XmlXPathSelector("@name")
    public Name!: string;

    @XmlXPathSelector("@content")
    public Content!: string;

    @XmlXPathSelector("@refines")
    public Refine!: string;

    @XmlXPathSelector("@scheme")
    public Scheme!: string;

    @XmlXPathSelector("@property")
    public Property!: string;

    @XmlXPathSelector("@id | @xml:id")
    public ID!: string;

    @XmlXPathSelector("@lang | @xml:lang")
    public Lang!: string;
}
