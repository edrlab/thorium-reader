// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { XmlObject, XmlXPathSelector } from "@r2-utils-js/_utils/xml-js-mapper";

import { tryDecodeURI } from "../../_utils/decodeURI";

@XmlObject({
    epub: "http://www.idpf.org/2007/ops",
    smil: "http://www.w3.org/ns/SMIL",
    smil2: "http://www.w3.org/2001/SMIL20/",
    xml: "http://www.w3.org/XML/1998/namespace",
})
export class Img {

    // XPATH ROOT: /smil:smil/smil:body/**/smil:img

    // @XmlXPathSelector("@epub:type")
    // public EpubType!: string;

    @XmlXPathSelector("@id | @xml:id")
    public ID!: string;

    // @XmlXPathSelector("@dur")
    // public Duration!: string;

    // @XmlXPathSelector("@fill")
    // public Fill!: string;

    // @XmlXPathSelector("@class")
    // public Class!: string;

    // @XmlXPathSelector("@customTest")
    // public CustomTest!: string;

    // @XmlXPathSelector("@system-required")
    // public SystemRequired!: string;

    @XmlXPathSelector("@src")
    public Src1!: string;
    get Src(): string {
        return this.Src1;
    }
    set Src(href: string) {
        this.Src1 = href;
        this._urlDecoded = undefined;
    }
    private _urlDecoded: string | undefined | null;
    get SrcDecoded(): string | undefined {
        if (this._urlDecoded) {
            return this._urlDecoded;
        }
        if (this._urlDecoded === null) {
            return undefined;
        }
        if (!this.Src) {
            this._urlDecoded = null;
            return undefined;
        }
        this._urlDecoded = tryDecodeURI(this.Src);
        return !this._urlDecoded ? undefined : this._urlDecoded;
    }
    set SrcDecoded(href: string | undefined) {
        this._urlDecoded = href;
    }
    public setSrcDecoded(href: string) {
        this.Src = href;
        this.SrcDecoded = href;
    }
}
