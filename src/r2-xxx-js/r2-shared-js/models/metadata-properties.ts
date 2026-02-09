// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// https://github.com/edcarroll/ta-json
import { JsonElementType, JsonObject, JsonProperty } from "ta-json-x";

import { Encrypted } from "@r2-lcp-js/models/metadata-encrypted";
import { IWithAdditionalJSON, JsonMap } from "@r2-lcp-js/serializable";

export enum LayoutEnum {
    Fixed = "fixed",
    Reflowable = "reflowable",
}

export enum OrientationEnum {
    Auto = "auto",
    Landscape = "landscape",
    Portrait = "portrait",
}

export enum OverflowEnum {
    Auto = "auto",
    Paginated = "paginated",
    Scrolled = "scrolled",
    ScrolledContinuous = "scrolled-continuous",
}

export enum PageEnum {
    Left = "left",
    Right = "right",
    Center = "center",
}

export enum SpreadEnum {
    Auto = "auto",
    Both = "both",
    None = "none",
    Landscape = "landscape",
}

// [\n\s\S]+?^[ ]+@JsonProperty\(("[a-zA-Z]+")\)$
// regexp replace all:
// $1,
// tslint:disable-next-line:max-line-length
export const PropertiesSupportedKeys = ["contains", "layout", "orientation", "overflow", "page", "spread", "encrypted", "media-overlay"];

// tslint:disable-next-line:max-line-length
// https://github.com/readium/webpub-manifest/blob/917c83e798e3eda42b3e9d0dc92f0fef31b16211/schema/extensions/epub/properties.schema.json
@JsonObject()
export class Properties implements IWithAdditionalJSON {

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/917c83e798e3eda42b3e9d0dc92f0fef31b16211/schema/extensions/epub/properties.schema.json#L7
    @JsonProperty("contains")
    @JsonElementType(String)
    public Contains!: string[];

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/917c83e798e3eda42b3e9d0dc92f0fef31b16211/schema/extensions/epub/properties.schema.json#L23
    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/917c83e798e3eda42b3e9d0dc92f0fef31b16211/schema/extensions/epub/metadata.schema.json#L10
    @JsonProperty("layout")
    public Layout!: string;
    // see LayoutEnum

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/917c83e798e3eda42b3e9d0dc92f0fef31b16211/schema/properties.schema.json#L7
    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/917c83e798e3eda42b3e9d0dc92f0fef31b16211/schema/extensions/epub/metadata.schema.json#L18
    @JsonProperty("orientation")
    public Orientation!: string;
    // see OrientationEnum

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/917c83e798e3eda42b3e9d0dc92f0fef31b16211/schema/extensions/epub/properties.schema.json#L36
    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/917c83e798e3eda42b3e9d0dc92f0fef31b16211/schema/extensions/epub/metadata.schema.json#L27
    @JsonProperty("overflow")
    public Overflow!: string;
    // see OverflowEnum

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/917c83e798e3eda42b3e9d0dc92f0fef31b16211/schema/properties.schema.json#L16
    @JsonProperty("page")
    public Page!: string;
    // see PageEnum

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/917c83e798e3eda42b3e9d0dc92f0fef31b16211/schema/extensions/epub/properties.schema.json#L46
    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/917c83e798e3eda42b3e9d0dc92f0fef31b16211/schema/extensions/epub/metadata.schema.json#L37
    @JsonProperty("spread")
    public Spread!: string;
    // see SpreadEnum

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/917c83e798e3eda42b3e9d0dc92f0fef31b16211/schema/extensions/epub/properties.schema.json#L56
    @JsonProperty("encrypted")
    public Encrypted!: Encrypted;

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/917c83e798e3eda42b3e9d0dc92f0fef31b16211/schema/extensions/epub/properties.schema.json#L31
    @JsonProperty("media-overlay")
    public MediaOverlay!: string;

    // BEGIN IWithAdditionalJSON
    public AdditionalJSON!: JsonMap;
    // END IWithAdditionalJSON
}
