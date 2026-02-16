// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// https://github.com/edcarroll/ta-json
import { JsonObject, JsonProperty } from "ta-json-x";

import { Metadata } from "@r2-shared-js/models/metadata";

// BEGIN IWithAdditionalJSON
// [\n\s\S]+?^[ ]+@JsonProperty\(("[a-zA-Z]+")\)$
// regexp replace all:
// $1,
// tslint:disable-next-line:max-line-length
// export const OPDS2MetadataSupportedKeys = MetadataSupportedKeys.concat(["numberOfItems", "itemsPerPage", "currentPage"]);

// tslint:disable-next-line:max-line-length
// https://github.com/opds-community/drafts/blob/4d82fb9a64f35a174a5f205c23ba623ec010d5ec/schema/feed-metadata.schema.json
@JsonObject()
export class OPDSMetadata extends Metadata {

    // tslint:disable-next-line:max-line-length
    // https://github.com/opds-community/drafts/blob/4d82fb9a64f35a174a5f205c23ba623ec010d5ec/schema/feed-metadata.schema.json#L44
    @JsonProperty("numberOfItems")
    public NumberOfItems!: number;

    // tslint:disable-next-line:max-line-length
    // https://github.com/opds-community/drafts/blob/4d82fb9a64f35a174a5f205c23ba623ec010d5ec/schema/feed-metadata.schema.json#L36
    @JsonProperty("itemsPerPage")
    public ItemsPerPage!: number;

    // tslint:disable-next-line:max-line-length
    // https://github.com/opds-community/drafts/blob/4d82fb9a64f35a174a5f205c23ba623ec010d5ec/schema/feed-metadata.schema.json#L40
    @JsonProperty("currentPage")
    public CurrentPage!: number;

    // BEGIN IWithAdditionalJSON
    // public get SupportedKeys() {
    //     return OPDS2MetadataSupportedKeys;
    // }
    // END IWithAdditionalJSON
}
