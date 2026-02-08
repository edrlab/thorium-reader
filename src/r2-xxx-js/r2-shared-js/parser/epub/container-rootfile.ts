// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { XmlObject, XmlXPathSelector } from "@r2-utils-js/_utils/xml-js-mapper";

import { tryDecodeURI } from "../../_utils/decodeURI";

@XmlObject()
export class Rootfile {

    // XPATH ROOT: /epub:container/epub:rootfiles/epub:rootfile

    @XmlXPathSelector("@media-type")
    public Type!: string;

    @XmlXPathSelector("@version")
    public Version!: string;

    @XmlXPathSelector("@full-path")
    public Path1!: string;
    get Path(): string {
        return this.Path1;
    }
    set Path(href: string) {
        this.Path1 = href;
        this._urlDecoded = undefined;
    }
    private _urlDecoded: string | undefined | null;
    get PathDecoded(): string | undefined {
        if (this._urlDecoded) {
            return this._urlDecoded;
        }
        if (this._urlDecoded === null) {
            return undefined;
        }
        if (!this.Path) {
            this._urlDecoded = null;
            return undefined;
        }
        this._urlDecoded = tryDecodeURI(this.Path);
        return !this._urlDecoded ? undefined : this._urlDecoded;
    }
    set PathDecoded(href: string | undefined) {
        this._urlDecoded = href;
    }
    public setPathDecoded(href: string) {
        this.Path = href;
        this.PathDecoded = href;
    }
}
