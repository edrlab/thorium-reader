// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { XmlObject, XmlXPathSelector } from "@r2-utils-js/_utils/xml-js-mapper";

@XmlObject({
    opf: "http://www.idpf.org/2007/opf",
})
export class MetaLink {

    // XPATH ROOT: /opf:package/opf:metadata/opf:link

    // TODO: remove unused attribute?
    @XmlXPathSelector("@property")
    public Property!: string;

    @XmlXPathSelector("@rel")
    public Rel!: string;

    @XmlXPathSelector("@href")
    public Href!: string;

    @XmlXPathSelector("@properties")
    public Properties!: string;

    @XmlXPathSelector("@media-type")
    public MediaType!: string;

    @XmlXPathSelector("@refines")
    public Refines!: string;

    @XmlXPathSelector("@id")
    public ID!: string;
}
