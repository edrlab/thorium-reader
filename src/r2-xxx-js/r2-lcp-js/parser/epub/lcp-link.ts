// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// https://github.com/edcarroll/ta-json
import { JsonObject, JsonProperty } from "ta-json-x";

@JsonObject()
export class Link {

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/lcp-specs/blob/5828f83b6fffee23cbc38870f6f6431744191f21/schema/link.schema.json#L38
    @JsonProperty("length")
    public Length!: number;

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/lcp-specs/blob/5828f83b6fffee23cbc38870f6f6431744191f21/schema/link.schema.json#L7
    @JsonProperty("href")
    public Href!: string;

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/lcp-specs/blob/5828f83b6fffee23cbc38870f6f6431744191f21/schema/link.schema.json#L19
    @JsonProperty("title")
    public Title!: string;

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/lcp-specs/blob/5828f83b6fffee23cbc38870f6f6431744191f21/schema/link.schema.json#L11
    @JsonProperty("type")
    public Type!: string;

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/lcp-specs/blob/5828f83b6fffee23cbc38870f6f6431744191f21/schema/link.schema.json#L15
    @JsonProperty("templated")
    public Templated!: boolean;

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/lcp-specs/blob/5828f83b6fffee23cbc38870f6f6431744191f21/schema/link.schema.json#L33
    @JsonProperty("profile")
    public Profile!: string;

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/lcp-specs/blob/5828f83b6fffee23cbc38870f6f6431744191f21/schema/link.schema.json#L42
    @JsonProperty("hash")
    public Hash!: string;

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/lcp-specs/blob/5828f83b6fffee23cbc38870f6f6431744191f21/schema/link.schema.json#L23
    @JsonProperty("rel")
    public Rel!: string;

    public HasRel(rel: string): boolean {
        return this.Rel === rel;
    }

    public SetRel(rel: string) {
        this.Rel = rel;
    }
}
