// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { XmlObject } from "@r2-utils-js/_utils/xml-js-mapper";

import { Seq } from "./smil-seq";

@XmlObject({
    epub: "http://www.idpf.org/2007/ops",
    smil: "http://www.w3.org/ns/SMIL",
    smil2: "http://www.w3.org/2001/SMIL20/",
})
export class Body extends Seq {

    // XPATH ROOT: /smil:smil/smil:body

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: TS6133 (is declared but its value is never read.)
    private isBody = true;
}
