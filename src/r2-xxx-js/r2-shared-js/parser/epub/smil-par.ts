// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import {
    XmlDiscriminatorValue, XmlObject, XmlXPathSelector,
} from "@r2-utils-js/_utils/xml-js-mapper";

import { Audio } from "./smil-audio";
import { Video } from "./smil-video";
import { Img } from "./smil-img";
import { SeqOrPar } from "./smil-seq-or-par";
import { Text } from "./smil-text";

@XmlObject({
    epub: "http://www.idpf.org/2007/ops",
    smil: "http://www.w3.org/ns/SMIL",
    smil2: "http://www.w3.org/2001/SMIL20/",
})
@XmlDiscriminatorValue("par")
export class Par extends SeqOrPar {

    // XPATH ROOT: /smil:smil/smil:body/**/smil:par

    // @XmlXPathSelector("smil:text | smil2:text")
    @XmlXPathSelector("text")
    public Text!: Text;

    // @XmlXPathSelector("smil:audio | smil2:audio")
    @XmlXPathSelector("audio")
    public Audio!: Audio;

    // @XmlXPathSelector("smil:video | smil2:video")
    @XmlXPathSelector("video")
    public Video!: Video;

    // @XmlXPathSelector("smil:img | smil2:img")
    @XmlXPathSelector("img")
    public Img!: Img;

    // constructor() {
    //     super();
    //     this.localName = "par";
    // }

    // public inspect(depth: number, opts: any): string | null | undefined {
    //     return "PAR";
    // }
}
