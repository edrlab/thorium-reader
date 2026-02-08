// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { XmlObject, XmlXPathSelector } from "@r2-utils-js/_utils/xml-js-mapper";

import { XMetadata } from "./opf-x-metadata";
import { CustomAttributes } from "./smil-custom-attributes";

@XmlObject({
    epub: "http://www.idpf.org/2007/ops",
    smil: "http://www.w3.org/ns/SMIL",
    smil2: "http://www.w3.org/2001/SMIL20/",
})
export class Head extends XMetadata {

    // XPATH ROOT: /smil:smil/smil:head

    @XmlXPathSelector("customAttributes")
    // @XmlItemType(CustomAttributes)
    public CustomAttributes!: CustomAttributes;
}
