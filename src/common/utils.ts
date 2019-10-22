// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Contributor } from "r2-shared-js/dist/es6-es2015/src/models/metadata-contributor";
import { IStringMap } from "r2-shared-js/dist/es6-es2015/src/models/metadata-multilang";
import { diMainGet } from "readium-desktop/main/di";

// tslint:disable-next-line: max-line-length
// https://readium2.herokuapp.com/pub/aHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL0lEUEYvZXB1YjMtc2FtcGxlcy9tYXN0ZXIvMzAvcmVnaW1lLWFudGljYW5jZXItYXJhYmljL01FVEEtSU5GL2NvbnRhaW5lci54bWw%3D/manifest.json/show/all
// tslint:disable-next-line: max-line-length
// https://github.com/readium/webpub-manifest/blob/ff5c1e9e76ccc184d4d670179cfb70ced691fcec/schema/metadata.schema.json#L15-L32
export function convertMultiLangStringToString(items: string | IStringMap | undefined): string {
    if (typeof items === "object") {
        const translator = diMainGet("translator");
        const langs = Object.keys(items);
        const lang = langs.filter((l) => l.includes(translator.getLocale()));
        const localeLang = lang[0];
        return items[localeLang] || items[langs[0]];
    }
    return items;
}

export function convertContributorArrayToStringArray(items: Contributor[] | undefined): string[] {
    if (!items) {
        return  [];
    }

    return items.map((item) => {
        if (typeof item.Name === "object") {
            return convertMultiLangStringToString(item.Name);
        }
        return item.Name;
    });
}
