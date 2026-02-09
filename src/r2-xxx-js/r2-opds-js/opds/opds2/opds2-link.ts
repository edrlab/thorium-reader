// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// https://github.com/edcarroll/ta-json
import { JsonObject, JsonProperty } from "ta-json-x";

import { Link } from "@r2-shared-js/models/publication-link";

import { OPDSProperties } from "./opds2-properties";

// tslint:disable-next-line:max-line-length
// https://github.com/opds-community/drafts/blob/abc6cd444e5e727b127317ecf1f0b9071ecd4272/schema/publication.schema.json#L22
// tslint:disable-next-line:max-line-length
// https://github.com/opds-community/drafts/blob/abc6cd444e5e727b127317ecf1f0b9071ecd4272/schema/publication.schema.json#L36
export enum OPDSLinkRelEnum {
    Preview = "preview",
    PreviewURI = "http://opds-spec.org/acquisition/preview",
    AcquisitionURI = "http://opds-spec.org/acquisition",
    BuyURI = "http://opds-spec.org/acquisition/buy",
    OpenAccessURI = "http://opds-spec.org/acquisition/open-access",
    BorrowURI = "http://opds-spec.org/acquisition/borrow",
    SampleURI = "http://opds-spec.org/acquisition/sample",
    SubscribeURI = "http://opds-spec.org/acquisition/subscribe",
}

const PROPERTIES_JSON_PROP = "properties";

// tslint:disable-next-line:max-line-length
// https://github.com/readium/webpub-manifest/blob/917c83e798e3eda42b3e9d0dc92f0fef31b16211/schema/link.schema.json
@JsonObject()
export class OPDSLink extends Link {

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/917c83e798e3eda42b3e9d0dc92f0fef31b16211/schema/link.schema.json#L33
    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/917c83e798e3eda42b3e9d0dc92f0fef31b16211/schema/properties.schema.json
    // tslint:disable-next-line:max-line-length
    // https://github.com/opds-community/drafts/blob/aa414dc7150588dbb422be2c643a7a74fec6e64d/schema/properties.schema.json
    @JsonProperty(PROPERTIES_JSON_PROP)
    public Properties!: OPDSProperties;
}
