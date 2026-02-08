// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { XmlItemType, XmlObject, XmlXPathSelector } from "@r2-utils-js/_utils/xml-js-mapper";

import { Rootfile } from "./container-rootfile";

@XmlObject({
    dummyNS: "dummyURI",
    epub: "wrong2",
    rendition: "wrong1",
})
export class Container {

    // XPATH ROOT: /epub:container

    @XmlXPathSelector("epub:rootfiles/epub:rootfile",
        {
            epub: "urn:oasis:names:tc:opendocument:xmlns:container",
            rendition: "http://www.idpf.org/2013/rendition",
        })
    @XmlItemType(Rootfile)
    public Rootfile!: Rootfile[];

    public ZipPath: string | undefined; // URL already decodeURI()
}
