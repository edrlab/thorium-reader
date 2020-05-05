// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { convertMultiLangStringToString } from "readium-desktop/main/converter/tools/localisation";

import { OPDSPublication } from "@r2-opds-js/opds/opds2/opds2-publication";

export const getTagsFromOpdsPublication = (r2OpdsPublication: OPDSPublication | undefined) => {
    let tags: string[];
    if (r2OpdsPublication?.Metadata?.Subject) {
        const metadata = r2OpdsPublication.Metadata;
        tags = Array.isArray(metadata.Subject) &&
            metadata.Subject.map((subject) => convertMultiLangStringToString(subject.Name || subject.Code));
    }

    return tags;
};
