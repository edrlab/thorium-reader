// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { availableLanguages } from "readium-desktop/common/services/translator";
import { IOpdsContributorView } from "readium-desktop/common/views/opds";
import { convertMultiLangStringToString } from "readium-desktop/common/language-string";
import { IStringMap } from "@r2-shared-js/models/metadata-multilang";

export const formatContributorToString = (
    publicationLanguages: Array<string> | undefined,
    contributors: (string | IStringMap)[] | IOpdsContributorView[] | undefined,
    locale: keyof typeof availableLanguages): string => {

    let retString = "";

    if (Array.isArray(contributors)) {

        for (const contributor of contributors) {
            const newContributor = contributor;
            if (retString !== "") {
                retString += ", ";
            }

            if (typeof newContributor === "string") {

                const textObj = newContributor;
                const pubLangs = publicationLanguages;
                const pubLang = pubLangs ? pubLangs[0] : undefined; // TODO: OPF xml:lang on title meta is actually the lang, not the declared pub lang(s)!
                const textObj_ = pubLang && typeof textObj === "string" ? { [pubLang]: textObj } : textObj;
                retString += convertMultiLangStringToString(textObj_, locale);
            } else if (newContributor.nameLangString) {

                const textObj = newContributor.nameLangString;
                const pubLangs = publicationLanguages;
                const pubLang = pubLangs ? pubLangs[0] : undefined; // TODO: OPF xml:lang on title meta is actually the lang, not the declared pub lang(s)!
                const textObj_ = pubLang && typeof textObj === "string" ? { [pubLang]: textObj } : textObj;
                retString += convertMultiLangStringToString(textObj_, locale);
            } else {

                const textObj = newContributor as IStringMap;
                const pubLangs = publicationLanguages;
                const pubLang = pubLangs ? pubLangs[0] : undefined; // TODO: OPF xml:lang on title meta is actually the lang, not the declared pub lang(s)!
                const textObj_ = pubLang && typeof textObj === "string" ? { [pubLang]: textObj } : textObj;
                retString += convertMultiLangStringToString(textObj_, locale);
                // const textLangStr = convertMultiLangStringToLangString(stringMap, locale);
                // const textLang = textLangStr && textLangStr[0] ? textLangStr[0].toLowerCase() : "";
                // const textIsRTL = langStringIsRTL(textLang);
                // const textStr = textLangStr && textLangStr[1] ? textLangStr[1] : "";
            }
        }
    }

    return retString;
};
