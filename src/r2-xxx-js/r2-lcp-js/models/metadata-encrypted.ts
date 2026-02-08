// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// https://github.com/edcarroll/ta-json
import { JsonObject, JsonProperty } from "ta-json-x";

// tslint:disable-next-line:max-line-length
// https://github.com/readium/webpub-manifest/blob/917c83e798e3eda42b3e9d0dc92f0fef31b16211/schema/extensions/epub/properties.schema.json#L56
@JsonObject()
export class Encrypted {

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/917c83e798e3eda42b3e9d0dc92f0fef31b16211/schema/extensions/epub/properties.schema.json#L78
    @JsonProperty("scheme")
    public Scheme!: string;

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/917c83e798e3eda42b3e9d0dc92f0fef31b16211/schema/extensions/epub/properties.schema.json#L73
    @JsonProperty("profile")
    public Profile!: string;

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/917c83e798e3eda42b3e9d0dc92f0fef31b16211/schema/extensions/epub/properties.schema.json#L60
    @JsonProperty("algorithm")
    public Algorithm!: string;

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/917c83e798e3eda42b3e9d0dc92f0fef31b16211/schema/extensions/epub/properties.schema.json#L65
    @JsonProperty("compression")
    public Compression!: string;

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/7f3ccaa1604fa956fb89a16da4fe8ea730c11f9a/schema/extensions/epub/properties.schema.json#L49
    @JsonProperty("originalLength")
    public OriginalLength2!: number;
    @JsonProperty("original-length")
    public OriginalLength1!: number | undefined;
    get OriginalLength(): number | undefined {
        return typeof this.OriginalLength2 !== "undefined" ? this.OriginalLength2 : this.OriginalLength1;
    }
    set OriginalLength(length: number | undefined) {
        if (typeof length !== "undefined") {
            this.OriginalLength1 = undefined;
            this.OriginalLength2 = length;
        }
    }

    public DecryptedLengthBeforeInflate = -1;
    public CypherBlockPadding = -1;
    public CypherBlockIV: string | undefined; // Buffer | undefined;
}
