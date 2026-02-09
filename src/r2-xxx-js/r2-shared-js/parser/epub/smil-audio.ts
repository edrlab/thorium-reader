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
export class Audio {

    // XPATH ROOT: /smil:smil/smil:body/**/smil:audio

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

    @XmlXPathSelector("@clipBegin") // DAISY3
    public ClipBegin1!: string;
    @XmlXPathSelector("@clip-begin") // DAISY2
    public ClipBegin2!: string | undefined;
    get ClipBegin(): string | undefined {
        return this.ClipBegin1 ? this.ClipBegin1 : this.ClipBegin2;
    }
    set ClipBegin(clipBegin: string | undefined) {
        if (clipBegin) {
            this.ClipBegin1 = clipBegin;
            this.ClipBegin2 = undefined;
        }
    }

    @XmlXPathSelector("@clipEnd") // DAISY3
    public ClipEnd1!: string;
    @XmlXPathSelector("@clip-end") // DAISY2
    public ClipEnd2!: string | undefined;
    get ClipEnd(): string | undefined {
        return this.ClipEnd1 ? this.ClipEnd1 : this.ClipEnd2;
    }
    set ClipEnd(clipEnd: string | undefined) {
        if (clipEnd) {
            this.ClipEnd1 = clipEnd;
            this.ClipEnd2 = undefined;
        }
    }

    @XmlXPathSelector("@epub:type")
    public EpubType!: string;

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
