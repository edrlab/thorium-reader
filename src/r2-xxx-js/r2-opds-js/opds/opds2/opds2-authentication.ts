// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// https://github.com/edcarroll/ta-json
import { JsonElementType, JsonObject, JsonProperty, OnDeserialized } from "ta-json-x";

import { IWithAdditionalJSON, JsonMap } from "@r2-lcp-js/serializable";

import { OPDSAuthenticationLabels } from "./opds2-authentication-labels";
import { OPDSLink } from "./opds2-link";

// [\n\s\S]+?^[ ]+@JsonProperty\(("[a-zA-Z]+")\)$
// regexp replace all:
// $1,
// tslint:disable-next-line:max-line-length
// export const OPDSAuthenticationSupportedKeys = ["type", "links", "labels"];

const LINKS_JSON_PROP = "links";

// tslint:disable-next-line:max-line-length
// https://github.com/opds-community/drafts/blob/abc6cd444e5e727b127317ecf1f0b9071ecd4272/schema/authentication.schema.json#L27
@JsonObject()
export class OPDSAuthentication implements IWithAdditionalJSON {

    // tslint:disable-next-line:max-line-length
    // https://github.com/opds-community/drafts/blob/abc6cd444e5e727b127317ecf1f0b9071ecd4272/schema/authentication.schema.json#L32
    @JsonProperty("type")
    public Type!: string;

    // tslint:disable-next-line:max-line-length
    // https://github.com/opds-community/drafts/blob/abc6cd444e5e727b127317ecf1f0b9071ecd4272/schema/authentication.schema.json#L36
    @JsonProperty(LINKS_JSON_PROP)
    @JsonElementType(OPDSLink)
    public Links!: OPDSLink[];

    // tslint:disable-next-line:max-line-length
    // https://github.com/opds-community/drafts/blob/abc6cd444e5e727b127317ecf1f0b9071ecd4272/schema/authentication.schema.json#L43
    @JsonProperty("labels")
    public Labels!: OPDSAuthenticationLabels;

    // BEGIN IWithAdditionalJSON
    public AdditionalJSON!: JsonMap;
    // public get SupportedKeys() {
    //     return OPDSAuthenticationSupportedKeys;
    // }

    // public parseAdditionalJSON(json: JsonMap) {
    //     parseAdditionalJSON(this, json);

    //     if (this.Links) {
    //         this.Links.forEach((link, i) => {
    //             link.parseAdditionalJSON((json[LINKS_JSON_PROP] as JsonArray)[i] as JsonMap);
    //         });
    //     }
    // }
    // public generateAdditionalJSON(json: JsonMap) {
    //     generateAdditionalJSON(this, json);

    //     if (this.Links) {
    //         this.Links.forEach((link, i) => {
    //             link.generateAdditionalJSON((json[LINKS_JSON_PROP] as JsonArray)[i] as JsonMap);
    //         });
    //     }
    // }
    // END IWithAdditionalJSON

    @OnDeserialized()
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: TS6133 (is declared but its value is never read.)
    protected _OnDeserialized() {
        // tslint:disable-next-line:max-line-length
        // https://github.com/opds-community/drafts/blob/abc6cd444e5e727b127317ecf1f0b9071ecd4272/schema/authentication.schema.json#L55
        if (!this.Type) {
            console.log("OPDSAuthentication.Type is not set!");
        }
    }
}
