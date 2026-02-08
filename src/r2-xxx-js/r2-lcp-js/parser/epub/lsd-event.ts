// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// https://github.com/edcarroll/ta-json
import { JsonObject, JsonProperty } from "ta-json-x";

export enum TypeEnum {
    Register = "register",
    Renew = "renew",
    Return = "return",
    Revoke = "revoke",
    Cancel = "cancel",
}

@JsonObject()
export class LsdEvent {

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/lcp-specs/blob/5828f83b6fffee23cbc38870f6f6431744191f21/schema/status.schema.json#L68
    @JsonProperty("type")
    public Type!: string;
    // see TypeEnum

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/lcp-specs/blob/5828f83b6fffee23cbc38870f6f6431744191f21/schema/status.schema.json#L79
    @JsonProperty("name")
    public Name!: string;

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/lcp-specs/blob/5828f83b6fffee23cbc38870f6f6431744191f21/schema/status.schema.json#L83
    @JsonProperty("id")
    public ID!: string;

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/lcp-specs/blob/5828f83b6fffee23cbc38870f6f6431744191f21/schema/status.schema.json#L87
    @JsonProperty("timestamp")
    public TimeStamp!: Date;
}
