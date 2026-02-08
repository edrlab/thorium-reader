// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// https://github.com/edcarroll/ta-json
import { JsonObject, JsonProperty } from "ta-json-x";

@JsonObject()
export class PotentialRights {

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/lcp-specs/blob/5828f83b6fffee23cbc38870f6f6431744191f21/schema/status.schema.json#L56
    @JsonProperty("end")
    public End!: Date;
}
