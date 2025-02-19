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
// tslint:disable-next-line: max-line-length
// https://github.com/readium/webpub-manifest/blob/ff5c1e9e76ccc184d4d670179cfb70ced691fcec/schema/contributor-object.schema.json#L7-L24
// tslint:disable-next-line: max-line-length
// https://github.com/readium/webpub-manifest/blob/ff5c1e9e76ccc184d4d670179cfb70ced691fcec/schema/metadata.schema.json#L15-L32
export function convertMultiLangStringToString(items: string | IStringMap | undefined, locale: keyof typeof availableLanguages): string | undefined {
    if (typeof items === "object") {
        // see translator.translateContentField() ?
        const langs = Object.keys(items);
        const lang = langs.filter((l) =>
            l.toLowerCase().includes(locale.toLowerCase()));
        const localeLang = lang[0];
        return items[localeLang] ||
            items._ || items[BCP47_UNKNOWN_LANG] ||
            items[langs[0]];
    }
    return items;
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

export function convertMultiLangStringToLangString(items: string | IStringMap | undefined, locale: keyof typeof availableLanguages): [lang: string, str: string | undefined] {
    if (typeof items === "object") {
        // see translator.translateContentField() ?
        const langs = Object.keys(items);
        const lang = langs.filter((l) =>
            l.toLowerCase().includes(locale.toLowerCase()));
        const localeLang = lang[0];

        if (items[localeLang]) {
            return [localeLang, items[localeLang]];
        }
        if (items._) {
            return [BCP47_UNKNOWN_LANG, items._];
        }
        if (items[BCP47_UNKNOWN_LANG]) {
            return [BCP47_UNKNOWN_LANG, items[BCP47_UNKNOWN_LANG]];
        }
        return [langs[0], items[langs[0]]];
    }
    return [BCP47_UNKNOWN_LANG, items];
}

export function langStringIsRTL(lang: string): boolean {
    return lang === "ar" || lang.startsWith("ar-") ||
        lang === "he" || lang.startsWith("he-") ||
        lang === "fa" || lang.startsWith("fa-") ||
        lang === "zh-Hant" ||
        lang === "zh-TW";
}
