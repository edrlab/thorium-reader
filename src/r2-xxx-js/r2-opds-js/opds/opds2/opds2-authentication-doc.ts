// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// https://github.com/edcarroll/ta-json
import { JsonElementType, JsonObject, JsonProperty, OnDeserialized } from "ta-json-x";

import { IWithAdditionalJSON, JsonMap } from "@r2-lcp-js/serializable";

import { OPDSAuthentication } from "./opds2-authentication";
import { OPDSLink } from "./opds2-link";

// application/vnd.opds.authentication.v1.0+json

// [\n\s\S]+?^[ ]+@JsonProperty\(("[a-zA-Z]+")\)$
// regexp replace all:
// $1,
// tslint:disable-next-line:max-line-length
// export const OPDSAuthenticationDocSupportedKeys = ["title", "id", "description", "links", "authentication"];

const AUTHENTICATION_JSON_PROP = "authentication";
const LINKS_JSON_PROP = "links";

// tslint:disable-next-line:max-line-length
// https://github.com/opds-community/drafts/blob/abc6cd444e5e727b127317ecf1f0b9071ecd4272/schema/authentication.schema.json
@JsonObject()
export class OPDSAuthenticationDoc implements IWithAdditionalJSON {

    // tslint:disable-next-line:max-line-length
    // https://github.com/opds-community/drafts/blob/abc6cd444e5e727b127317ecf1f0b9071ecd4272/schema/authentication.schema.json#L7
    @JsonProperty("title")
    public Title!: string;

    // tslint:disable-next-line:max-line-length
    // https://github.com/opds-community/drafts/blob/abc6cd444e5e727b127317ecf1f0b9071ecd4272/schema/authentication.schema.json#L11
    @JsonProperty("id")
    public Id!: string;

    // tslint:disable-next-line:max-line-length
    // https://github.com/opds-community/drafts/blob/abc6cd444e5e727b127317ecf1f0b9071ecd4272/schema/authentication.schema.json#L16
    @JsonProperty("description")
    public Description!: string;

    // tslint:disable-next-line:max-line-length
    // https://github.com/opds-community/drafts/blob/abc6cd444e5e727b127317ecf1f0b9071ecd4272/schema/authentication.schema.json#L20
    @JsonProperty(LINKS_JSON_PROP)
    @JsonElementType(OPDSLink)
    public Links!: OPDSLink[];

    // tslint:disable-next-line:max-line-length
    // https://github.com/opds-community/drafts/blob/abc6cd444e5e727b127317ecf1f0b9071ecd4272/schema/authentication.schema.json#L27
    @JsonProperty(AUTHENTICATION_JSON_PROP)
    @JsonElementType(OPDSAuthentication)
    public Authentication!: OPDSAuthentication[];

    // BEGIN IWithAdditionalJSON
    public AdditionalJSON!: JsonMap;
    // public get SupportedKeys() {
    //     return OPDSAuthenticationDocSupportedKeys;
    // }

    // public parseAdditionalJSON(json: JsonMap) {
    //     parseAdditionalJSON(this, json);

    //     if (this.Authentication) {
    //         this.Authentication.forEach((auth, i) => {
    //             auth.parseAdditionalJSON((json[AUTHENTICATION_JSON_PROP] as JsonArray)[i] as JsonMap);
    //         });
    //     }
    //     if (this.Links) {
    //         this.Links.forEach((link, i) => {
    //             link.parseAdditionalJSON((json[LINKS_JSON_PROP] as JsonArray)[i] as JsonMap);
    //         });
    //     }
    // }
    // public generateAdditionalJSON(json: JsonMap) {
    //     generateAdditionalJSON(this, json);

    //     if (this.Authentication) {
    //         this.Authentication.forEach((auth, i) => {
    //             auth.generateAdditionalJSON((json[AUTHENTICATION_JSON_PROP] as JsonArray)[i] as JsonMap);
    //         });
    //     }
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
        // https://github.com/opds-community/drafts/blob/abc6cd444e5e727b127317ecf1f0b9071ecd4272/schema/authentication.schema.json#L61
        if (!this.Authentication) {
            console.log("OPDSAuthenticationDoc.Authentication is not set!");
        }
        // tslint:disable-next-line:max-line-length
        // https://github.com/opds-community/drafts/blob/abc6cd444e5e727b127317ecf1f0b9071ecd4272/schema/authentication.schema.json#L62
        if (!this.Title) {
            console.log("OPDSAuthenticationDoc.Title is not set!");
        }
        // tslint:disable-next-line:max-line-length
        // https://github.com/opds-community/drafts/blob/abc6cd444e5e727b127317ecf1f0b9071ecd4272/schema/authentication.schema.json#L63
        if (!this.Id) {
            console.log("OPDSAuthenticationDoc.Id is not set!");
        }
    }
}
