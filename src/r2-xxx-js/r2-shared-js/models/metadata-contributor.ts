// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// https://github.com/edcarroll/ta-json
import {
    JsonConverter, JsonElementType, JsonObject, JsonProperty, OnDeserialized,
} from "ta-json-x";

import { JsonStringConverter } from "@r2-utils-js/_utils/ta-json-string-converter";

import { IStringMap } from "./metadata-multilang";
import { Link } from "./publication-link";

const LINKS_JSON_PROP = "links";

// tslint:disable-next-line:max-line-length
// https://github.com/readium/webpub-manifest/blob/0ac78ab5c270a608c39b4b04fc90bd9b1d281896/schema/contributor-object.schema.json
@JsonObject()
export class Contributor {

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/0ac78ab5c270a608c39b4b04fc90bd9b1d281896/schema/contributor-object.schema.json#L7
    @JsonProperty("name")
    public Name!: string | IStringMap;

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/0ac78ab5c270a608c39b4b04fc90bd9b1d281896/schema/contributor-object.schema.json#L29
    @JsonProperty("sortAs")
    public SortAs2!: string;
    @JsonProperty("sort_as")
    public SortAs1: string | undefined;
    get SortAs(): string | undefined {
        return this.SortAs2 ? this.SortAs2 : this.SortAs1;
    }
    set SortAs(sortas: string | undefined) {
        if (sortas) {
            this.SortAs1 = undefined;
            this.SortAs2 = sortas;
        }
    }

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/0ac78ab5c270a608c39b4b04fc90bd9b1d281896/schema/contributor-object.schema.json#L32
    @JsonProperty("role")
    @JsonConverter(JsonStringConverter)
    @JsonElementType(String)
    public Role!: string[];

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/0ac78ab5c270a608c39b4b04fc90bd9b1d281896/schema/contributor-object.schema.json#L25
    @JsonProperty("identifier")
    public Identifier!: string;

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/0ac78ab5c270a608c39b4b04fc90bd9b1d281896/schema/contributor-object.schema.json#L41
    @JsonProperty("position")
    public Position!: number;

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/0ac78ab5c270a608c39b4b04fc90bd9b1d281896/schema/contributor-object.schema.json#L44
    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/ca6d887caa2d0495200fef4695f41aacb5fed2e9/schema/link.schema.json
    @JsonProperty(LINKS_JSON_PROP)
    @JsonElementType(Link)
    public Links!: Link[];

    @OnDeserialized()
    // tslint:disable-next-line:no-unused-variable
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: TS6133 (is declared but its value is never read.)
    protected _OnDeserialized() { // tslint:disable-line

        // tslint:disable-next-line:max-line-length
        // https://github.com/readium/webpub-manifest/blob/0ac78ab5c270a608c39b4b04fc90bd9b1d281896/schema/contributor-object.schema.json#L52
        if (!this.Name) {
            console.log("Contributor.Name is not set!");
        }
    }
}
