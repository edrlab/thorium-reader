// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// https://github.com/edcarroll/ta-json
import { JsonObject, JsonProperty, OnDeserialized } from "ta-json-x";

// tslint:disable-next-line:max-line-length
// https://github.com/opds-community/drafts/blob/abc6cd444e5e727b127317ecf1f0b9071ecd4272/schema/authentication.schema.json#L43
@JsonObject()
export class OPDSAuthenticationLabels {

    // tslint:disable-next-line:max-line-length
    // https://github.com/opds-community/drafts/blob/abc6cd444e5e727b127317ecf1f0b9071ecd4272/schema/authentication.schema.json#L46
    @JsonProperty("login")
    public Login!: string;

    // tslint:disable-next-line:max-line-length
    // https://github.com/opds-community/drafts/blob/abc6cd444e5e727b127317ecf1f0b9071ecd4272/schema/authentication.schema.json#L49
    @JsonProperty("password")
    public Password!: string;

    @OnDeserialized()
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: TS6133 (is declared but its value is never read.)
    protected _OnDeserialized() {
        // if (!this.Login) {
        //     console.log("OPDSAuthenticationLabels.Login is not set!");
        // }
    }
}
