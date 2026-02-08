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

import { tryDecodeURI } from "../_utils/decodeURI";
import { MediaOverlayNode } from "./media-overlay";
import { Properties } from "./metadata-properties";

const PROPERTIES_JSON_PROP = "properties";
const CHILDREN_JSON_PROP = "children";
const ALTERNATE_JSON_PROP = "alternate";

// tslint:disable-next-line:max-line-length
// https://github.com/readium/webpub-manifest/blob/ca6d887caa2d0495200fef4695f41aacb5fed2e9/schema/link.schema.json
@JsonObject()
export class Link {

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/ca6d887caa2d0495200fef4695f41aacb5fed2e9/schema/link.schema.json#L11
    @JsonProperty("type")
    public TypeLink!: string;

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/ca6d887caa2d0495200fef4695f41aacb5fed2e9/schema/link.schema.json#L33
    @JsonProperty("height")
    public Height!: number;

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/ca6d887caa2d0495200fef4695f41aacb5fed2e9/schema/link.schema.json#L38
    @JsonProperty("width")
    public Width!: number;

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/ca6d887caa2d0495200fef4695f41aacb5fed2e9/schema/link.schema.json#L15
    @JsonProperty("title")
    public Title!: string;

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/917c83e798e3eda42b3e9d0dc92f0fef31b16211/schema/link.schema.json#L33
    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/917c83e798e3eda42b3e9d0dc92f0fef31b16211/schema/properties.schema.json
    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/917c83e798e3eda42b3e9d0dc92f0fef31b16211/schema/extensions/epub/properties.schema.json
    @JsonProperty(PROPERTIES_JSON_PROP)
    public Properties!: Properties;

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/ca6d887caa2d0495200fef4695f41aacb5fed2e9/schema/link.schema.json#L48
    @JsonProperty("duration")
    public Duration!: number;

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/ca6d887caa2d0495200fef4695f41aacb5fed2e9/schema/link.schema.json#L43
    // TODO: missing in OPDS schema:
    // https://github.com/opds-community/drafts/issues/20
    @JsonProperty("bitrate")
    public Bitrate!: number;

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/917c83e798e3eda42b3e9d0dc92f0fef31b16211/schema/link.schema.json#L15
    @JsonProperty("templated")
    public Templated!: boolean;

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/917c83e798e3eda42b3e9d0dc92f0fef31b16211/schema/link.schema.json#L57
    @JsonProperty(CHILDREN_JSON_PROP)
    @JsonElementType(Link)
    public Children!: Link[];

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/2bc1241901fabec746ce11193c71f7339c016a87/schema/link.schema.json#L73
    @JsonProperty(ALTERNATE_JSON_PROP)
    @JsonElementType(Link)
    public Alternate!: Link[];

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/ca6d887caa2d0495200fef4695f41aacb5fed2e9/schema/link.schema.json#L19
    @JsonProperty("rel")
    @JsonConverter(JsonStringConverter)
    @JsonElementType(String)
    public Rel!: string[];

    public MediaOverlays: MediaOverlayNode | undefined;

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/ca6d887caa2d0495200fef4695f41aacb5fed2e9/schema/link.schema.json#L7
    @JsonProperty("href")
    public Href1!: string;
    get Href(): string {
        return this.Href1;
    }
    set Href(href: string) {
        this.Href1 = href;
        this._urlDecoded = undefined;
    }
    private _urlDecoded: string | undefined | null;
    get HrefDecoded(): string | undefined {
        if (this._urlDecoded) {
            return this._urlDecoded;
        }
        if (this._urlDecoded === null) {
            return undefined;
        }
        if (!this.Href) {
            this._urlDecoded = null;
            return undefined;
        }
        this._urlDecoded = tryDecodeURI(this.Href);
        return !this._urlDecoded ? undefined : this._urlDecoded;
    }
    set HrefDecoded(href: string | undefined) {
        this._urlDecoded = href;
    }
    public setHrefDecoded(href: string) {
        this.Href = href;
        this.HrefDecoded = href;
    }

    public AddRels(rels: string[]) {
        rels.forEach((rel) => {
            this.AddRel(rel);
        });
    }

    public AddRel(rel: string) {
        if (this.HasRel(rel)) {
            return;
        }
        if (!this.Rel) {
            this.Rel = [rel];
        } else {
            this.Rel.push(rel);
        }
    }

    public HasRel(rel: string): boolean {
        return this.Rel && this.Rel.indexOf(rel) >= 0;
    }

    @OnDeserialized()
    // tslint:disable-next-line:no-unused-variable
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: TS6133 (is declared but its value is never read.)
    protected _OnDeserialized() {

        // https://github.com/readium/webpub-manifest/issues/23
        // tslint:disable-next-line:max-line-length
        // https://github.com/readium/webpub-manifest/blob/ca6d887caa2d0495200fef4695f41aacb5fed2e9/schema/link.schema.json#L59
        if (!this.Href && (!this.Children || !this.Children.length)) {
            console.log("Link.Href is not set! (and no child Links)");
        }
    }
}
