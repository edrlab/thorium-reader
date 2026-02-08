// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { XmlObject, XmlXPathSelector } from "@r2-utils-js/_utils/xml-js-mapper";

@XmlObject({
    xsd: "http://www.w3.org/2001/XMLSchema",
    xsi: "http://www.w3.org/2001/XMLSchema-instance",
})
export class Page {

    // XPATH ROOT: /ComicInfo/Pages/Page

    @XmlXPathSelector("@Image")
    public Image!: number;

    @XmlXPathSelector("@Bookmark")
    public Bookmark!: string;

    @XmlXPathSelector("@Type")
    public Type!: string;

    @XmlXPathSelector("@ImageSize")
    public ImageSize!: number;

    @XmlXPathSelector("@ImageWidth")
    public ImageWidth!: number;

    @XmlXPathSelector("@ImageHeight")
    public ImageHeight!: number;
}
