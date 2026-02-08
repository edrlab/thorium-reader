// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { XmlItemType, XmlObject, XmlXPathSelector } from "@r2-utils-js/_utils/xml-js-mapper";

import { DCMetadata } from "./opf-dc-metadata";
import { MetaLink } from "./opf-link";
import { Metafield } from "./opf-metafield";
import { XMetadata } from "./opf-x-metadata";

@XmlObject({
    dc: "http://purl.org/dc/elements/1.1/",
    opf: "http://www.idpf.org/2007/opf",
    opf2: "http://openebook.org/namespaces/oeb-package/1.0/",
})
export class Metadata extends DCMetadata {

    // XPATH ROOT: /opf:package/opf:metadata

    @XmlXPathSelector("link")
    @XmlItemType(MetaLink)
    public Link!: MetaLink[];

    @XmlXPathSelector("meta")
    @XmlItemType(Metafield)
    public Meta!: Metafield[];

    @XmlXPathSelector("dc-metadata")
    public DCMetadata!: DCMetadata;

    @XmlXPathSelector("x-metadata")
    public XMetadata!: XMetadata;
}
