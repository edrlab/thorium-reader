// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { XmlItemType, XmlObject, XmlXPathSelector } from "@r2-utils-js/_utils/xml-js-mapper";

import { Metafield } from "./opf-metafield";

@XmlObject({
    dc: "http://purl.org/dc/elements/1.1/",
    opf: "http://www.idpf.org/2007/opf",
    opf2: "http://openebook.org/namespaces/oeb-package/1.0/",
})
export class XMetadata {
    // XPATH ROOT: /opf:package/opf:metadata/x-metadata or /smil:smil/smil:head itself

    @XmlXPathSelector("meta")
    @XmlItemType(Metafield)
    public Meta!: Metafield[];
}
