// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Link } from "./publication-link";

// import { IMeta } from "./metadata";

/// UNUSED at the moment, see Publication:
///// public OtherCollections: IPublicationCollection[];

// TODO subcollection?
// tslint:disable-next-line:max-line-length
// https://github.com/readium/webpub-manifest/blob/0ac78ab5c270a608c39b4b04fc90bd9b1d281896/schema/publication.schema.json#L65
// tslint:disable-next-line:max-line-length
// https://github.com/readium/webpub-manifest/blob/0ac78ab5c270a608c39b4b04fc90bd9b1d281896/schema/subcollection.schema.json
export interface IPublicationCollection {
    Role: string;
    // Metadata: IMeta[];
    Links: Link[];
    Children: IPublicationCollection[];
}
