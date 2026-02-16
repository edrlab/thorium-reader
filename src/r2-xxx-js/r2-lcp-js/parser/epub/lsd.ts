// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// https://github.com/edcarroll/ta-json
import { JsonElementType, JsonObject, JsonProperty } from "ta-json-x";

import { Link } from "./lcp-link";
import { LsdEvent } from "./lsd-event";
import { PotentialRights } from "./lsd-potential-rights";
import { Updated } from "./lsd-updated";

export enum StatusEnum {
    Ready = "ready",
    Active = "active",
    Revoked = "revoked",
    Returned = "returned",
    Cancelled = "cancelled",
    Expired = "expired",
}

@JsonObject()
export class LSD {

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/lcp-specs/blob/5828f83b6fffee23cbc38870f6f6431744191f21/schema/status.schema.json#L7
    @JsonProperty("id")
    public ID!: string;

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/lcp-specs/blob/5828f83b6fffee23cbc38870f6f6431744191f21/schema/status.schema.json#L11
    @JsonProperty("status")
    public Status!: string;
    // see StatusEnum

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/lcp-specs/blob/5828f83b6fffee23cbc38870f6f6431744191f21/schema/status.schema.json#L23
    @JsonProperty("message")
    public Message!: string;

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/lcp-specs/blob/5828f83b6fffee23cbc38870f6f6431744191f21/schema/status.schema.json#L27
    @JsonProperty("updated")
    public Updated!: Updated;

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/lcp-specs/blob/5828f83b6fffee23cbc38870f6f6431744191f21/schema/status.schema.json#L46
    @JsonProperty("links")
    @JsonElementType(Link)
    public Links!: Link[];

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/lcp-specs/blob/5828f83b6fffee23cbc38870f6f6431744191f21/schema/status.schema.json#L53
    @JsonProperty("potential_rights")
    public PotentialRights!: PotentialRights;

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/lcp-specs/blob/5828f83b6fffee23cbc38870f6f6431744191f21/schema/status.schema.json#L63
    @JsonProperty("events")
    @JsonElementType(LsdEvent)
    public Events!: LsdEvent[];
}
