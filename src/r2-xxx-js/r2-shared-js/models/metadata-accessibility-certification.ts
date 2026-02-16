// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// https://github.com/edcarroll/ta-json
import { JsonElementType, JsonObject, JsonConverter, JsonProperty } from "ta-json-x";
import { JsonStringConverter } from "@r2-utils-js/_utils/ta-json-string-converter";

// tslint:disable-next-line:max-line-length
// https://github.com/readium/webpub-manifest/blob/03d7681cf1ff689bad76efaabc9c77423296a94c/schema/a11y.schema.json#L18-L31
@JsonObject()
export class AccessibilityCertification {

    // a11y:certifiedBy
    @JsonProperty("certifiedBy")
    @JsonConverter(JsonStringConverter)
    @JsonElementType(String)
    public CertifiedBy!: string[];

    // a11y:certifierCredential
    @JsonProperty("credential")
    @JsonConverter(JsonStringConverter)
    @JsonElementType(String)
    public Credential!: string[]; // may be link in EPUB3

    // a11y:certifierReport
    @JsonProperty("report")
    @JsonConverter(JsonStringConverter)
    @JsonElementType(String)
    public Report!: string[]; // link in EPUB3
}
