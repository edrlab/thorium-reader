// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// https://github.com/edcarroll/ta-json
import { JsonObject, JsonProperty } from "ta-json-x";

// TODO: MEDIA OVERLAY not in JSON Schema
// tslint:disable-next-line:max-line-length
// https://github.com/readium/webpub-manifest/tree/master/schema
@JsonObject()
export class MediaOverlay {

    // https://w3c.github.io/sync-media-pub/synchronized-narration.html#playback-styling
    // sync-media-css-class-active
    // sync-media-css-class-playing

    @JsonProperty("active-class")
    public ActiveClass!: string;

    @JsonProperty("playback-active-class")
    public PlaybackActiveClass!: string;
}
