// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// https://github.com/edcarroll/ta-json
import { JsonObject, JsonProperty } from "ta-json-x";

@JsonObject()
export class UserKey {

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/lcp-specs/blob/5828f83b6fffee23cbc38870f6f6431744191f21/schema/license.schema.json#L71
    @JsonProperty("text_hint")
    public TextHint!: string;

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/lcp-specs/blob/5828f83b6fffee23cbc38870f6f6431744191f21/schema/license.schema.json#L61
    @JsonProperty("algorithm")
    public Algorithm!: string;

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/lcp-specs/blob/5828f83b6fffee23cbc38870f6f6431744191f21/schema/license.schema.json#L66
    @JsonProperty("key_check")
    public KeyCheck!: string;
}
