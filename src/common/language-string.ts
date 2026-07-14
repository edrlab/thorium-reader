// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// import { Contributor } from "@r2-shared-js/models/metadata-contributor";
import { IStringMap } from "@r2-shared-js/models/metadata-multilang";
import { BCP47_UNKNOWN_LANG } from "@r2-shared-js/parser/epub";
import { availableLanguages } from "readium-desktop/common/services/translator";

// https://github.com/IDPF/epub3-samples/blob/master/30/regime-anticancer-arabic/EPUB/package.opf
//
// "author": [
//     {
//         "name": {
//             "ar": "دافيد  خيّاط لبروفيسورا",
//             "fr": "Pr David Khayat"
//         }
//     },
//     {
//         "name": {
//             "ar": "اردو هاتر ناتالي",
//             "fr": "Nathalie Hutter-Lardeau"
//         }
//     }
// ],
// "translator": {
//     "name": {
//         "ar": "فيّاض خليل مارينا",
//         "fr": "Marina Khalil Fayad"
//     }
// },
// "contributor": {
//     "name": "Vincent Gros",
//     "sortAs": "Gros, Vincent",
//     "role": "mrk"
// },
// "publisher": "Hachette Antoine",
//
// https://github.com/readium/webpub-manifest/blob/ff5c1e9e76ccc184d4d670179cfb70ced691fcec/schema/contributor-object.schema.json#L7-L24
// https://github.com/readium/webpub-manifest/blob/ff5c1e9e76ccc184d4d670179cfb70ced691fcec/schema/metadata.schema.json#L15-L32

// see translateContentFieldHelper()
export function convertMultiLangStringToString(stringOrObject: string | IStringMap | undefined, locale: keyof typeof availableLanguages): string | undefined {
    if (typeof stringOrObject === "object") {
        const objectLangKeys = Object.keys(stringOrObject);

        const localeLow = locale.toLowerCase();
        const localeLowI = localeLow.indexOf("-");
        const localeLowBase = localeLowI > 0 ? localeLow.substring(0, localeLowI) : localeLow;

        const langsWithLocaleMatch = objectLangKeys.filter((objectLangKey) => {

            const objectLangKeyLow = objectLangKey.toLowerCase();
            const objectLangKeyLowI = objectLangKeyLow.indexOf("-");
            const objectLangKeyLowBase = objectLangKeyLowI > 0 ? objectLangKeyLow.substring(0, objectLangKeyLowI) : objectLangKeyLow;

            return objectLangKeyLow === localeLow || objectLangKeyLowBase === localeLowBase;
        });

        const firstMatchedLocale = langsWithLocaleMatch[0]; // can be undefined for empty array
        const english = objectLangKeys.reduce((prev, cur) => {
            if (!!prev) {
                return prev;
            }
            if (cur.toLowerCase().split("-")[0] === "en") {
                return stringOrObject[cur];
            }
            return "";
        }, "");
        return stringOrObject[firstMatchedLocale] || // if undefined, cascade to unknown, English, and eventually first lang key
            stringOrObject._ ||
            stringOrObject[BCP47_UNKNOWN_LANG] ||
            english ||
            stringOrObject[objectLangKeys[0]];
    }
    return stringOrObject; // assume typeof stringOrObject === "string"
}

// Note that the contributor JSON Schema applies to the serialized format:
// https://github.com/readium/webpub-manifest/blob/master/schema/contributor.schema.json
// https://github.com/readium/webpub-manifest/blob/master/schema/contributor-object.schema.json
//
// By contrast,
// the in-memory data model (TypeScript) normalizes single items to one-length arrays,
// as well as single-string names to expanded object.
// See:
// https://github.com/readium/r2-shared-js/blob/develop/test/test-JSON-Contributor.ts
// https://github.com/readium/r2-shared-js/blob/develop/src/models/metadata-contributor-json-converter.ts
// https://github.com/readium/r2-shared-js/blob/develop/src/models/metadata-contributor.ts
// export function convertContributorArrayToStringArray(items: Contributor[] | undefined): (string | IStringMap)[] { // , locale: keyof typeof availableLanguages
//     if (!items) {
//         return  [];
//     }

//     return items.map((item) => {
//         // if (typeof item.Name === "object") {
//         //     return convertMultiLangStringToString(item.Name, locale);
//         // }
//         return item.Name;
//     });
// }

// see translateContentFieldHelper()
export function convertMultiLangStringToLangString(stringOrObject: string | IStringMap | undefined, locale: keyof typeof availableLanguages): [lang: string, str: string | undefined] {
    if (typeof stringOrObject === "object") {
        const objectLangKeys = Object.keys(stringOrObject);

        const localeLow = locale.toLowerCase();
        const localeLowI = localeLow.indexOf("-");
        const localeLowBase = localeLowI > 0 ? localeLow.substring(0, localeLowI) : localeLow;

        const langsWithLocaleMatch = objectLangKeys.filter((objectLangKey) => {

            const objectLangKeyLow = objectLangKey.toLowerCase();
            const objectLangKeyLowI = objectLangKeyLow.indexOf("-");
            const objectLangKeyLowBase = objectLangKeyLowI > 0 ? objectLangKeyLow.substring(0, objectLangKeyLowI) : objectLangKeyLow;

            return objectLangKeyLow === localeLow || objectLangKeyLowBase === localeLowBase;
        });

        const firstMatchedLocale = langsWithLocaleMatch[0]; // can be undefined for empty array

         // if undefined, cascade to unknown, English, and eventually first lang key

        if (stringOrObject[firstMatchedLocale]) {
            return [firstMatchedLocale, stringOrObject[firstMatchedLocale]];
        }

        if (stringOrObject._) {
            return [BCP47_UNKNOWN_LANG, stringOrObject._];
        }

        if (stringOrObject[BCP47_UNKNOWN_LANG]) {
            return [BCP47_UNKNOWN_LANG, stringOrObject[BCP47_UNKNOWN_LANG]];
        }

        const english = objectLangKeys.reduce((prev, cur) => {
            if (!!prev[0] && !!prev[1]) {
                return prev;
            }
            if (cur.toLowerCase().split("-")[0] === "en") {
                return [cur, stringOrObject[cur]] as [lang: string, str: string];
            }
            return ["", ""] as [lang: string, str: string];
        }, ["", ""] as [lang: string, str: string]);
        if (english[0] && english[1]) {
            return english;
        }

        return [objectLangKeys[0], stringOrObject[objectLangKeys[0]]];
    }
    return [BCP47_UNKNOWN_LANG, stringOrObject]; // assume typeof stringOrObject === "string"
}
