// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { XmlObject, XmlXPathSelector } from "@r2-utils-js/_utils/xml-js-mapper";

import { Body } from "./smil-body";
import { Head } from "./smil-head";
import { Par } from "./smil-par";

@XmlObject({
    epub: "http://www.idpf.org/2007/ops",
    smil: "http://www.w3.org/ns/SMIL",
    smil2: "http://www.w3.org/2001/SMIL20/",
})
export class SMIL {

    // XPATH ROOT: /smil:smil

    // @XmlXPathSelector("smil:head | smil2:head")
    @XmlXPathSelector("head")
    public Head!: Head;

    // @XmlXPathSelector("smil:body | smil2:body")
    // @XmlXPathSelector("smil:body")
    @XmlXPathSelector("body")
    public Body!: Body;

    // @XmlXPathSelector("smil:body")
    // public Body1!: Body;
    // @XmlXPathSelector("smil2:body")
    // public Body2!: Body | undefined;
    // get Body(): Body | undefined {
    //     return this.Body2 ? this.Body2 : this.Body1;
    // }
    // set Body(body: Body | undefined) {
    //     if (body) {
    //         this.Body1 = body;
    //         this.Body2 = undefined;
    //     }
    // }

    // Bug with Javascript / Typescript @ANNOTATION() !
    // Requires the class hierarchy to explicitely include all object types
    // (see SeqOrPar)
    @XmlXPathSelector("dummy")
    public Par!: Par;

    public ZipPath: string | undefined; // URL already decodeURI()
}
