// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// https://github.com/edcarroll/ta-json
import { JsonElementType, JsonObject, JsonProperty } from "ta-json-x";

import { Properties } from "@r2-shared-js/models/metadata-properties";

import { OPDSAvailability } from "./opds2-availability";
import { OPDSCopy } from "./opds2-copy";
import { OPDSHold } from "./opds2-hold";
import { OPDSIndirectAcquisition } from "./opds2-indirectAcquisition";
import { OPDSPrice } from "./opds2-price";

// BEGIN IWithAdditionalJSON
// [\n\s\S]+?^[ ]+@JsonProperty\(("[a-zA-Z]+")\)$
// regexp replace all:
// $1,
// tslint:disable-next-line:max-line-length
// export const OPDSPropertiesSupportedKeys = PropertiesSupportedKeys.concat(["numberOfItems", "price", "indirectAcquisition", "holds", "copies", "availability"]);

// tslint:disable-next-line:max-line-length
// https://github.com/opds-community/drafts/blob/2d027051a725ae62defdc7829b597564e5b8e9e5/schema/properties.schema.json
@JsonObject()
export class OPDSProperties extends Properties {

    // tslint:disable-next-line:max-line-length
    // https://github.com/opds-community/drafts/blob/2d027051a725ae62defdc7829b597564e5b8e9e5/schema/properties.schema.json#L7
    @JsonProperty("numberOfItems")
    public NumberOfItems!: number;

    // tslint:disable-next-line:max-line-length
    // https://github.com/opds-community/drafts/blob/2d027051a725ae62defdc7829b597564e5b8e9e5/schema/properties.schema.json#L12
    @JsonProperty("price")
    public Price!: OPDSPrice;

    // tslint:disable-next-line:max-line-length
    // https://github.com/opds-community/drafts/blob/2d027051a725ae62defdc7829b597564e5b8e9e5/schema/properties.schema.json#L45
    @JsonProperty("indirectAcquisition")
    @JsonElementType(OPDSIndirectAcquisition)
    public IndirectAcquisitions!: OPDSIndirectAcquisition[];

    // tslint:disable-next-line:max-line-length
    // https://github.com/opds-community/drafts/blob/2d027051a725ae62defdc7829b597564e5b8e9e5/schema/properties.schema.json#L52
    @JsonProperty("holds")
    public Holds!: OPDSHold;

    // tslint:disable-next-line:max-line-length
    // https://github.com/opds-community/drafts/blob/2d027051a725ae62defdc7829b597564e5b8e9e5/schema/properties.schema.json#L66
    @JsonProperty("copies")
    public Copies!: OPDSCopy;

    // tslint:disable-next-line:max-line-length
    // https://github.com/opds-community/drafts/blob/2d027051a725ae62defdc7829b597564e5b8e9e5/schema/properties.schema.json#L80
    @JsonProperty("availability")
    public Availability!: OPDSAvailability;

    // BEGIN IWithAdditionalJSON
    // public get SupportedKeys() {
    //     return OPDSPropertiesSupportedKeys;
    // }
    // END IWithAdditionalJSON
}
