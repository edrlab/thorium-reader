// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { availableLanguages, translateContentFieldHelper } from "readium-desktop/common/services/translator";
import { IOpdsContributorView } from "readium-desktop/common/views/opds";
import { IStringMap } from "@r2-shared-js/models/metadata-multilang";

export const formatContributorToString = (
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
                retString += translateContentFieldHelper(newContributor, locale);
            } else if (newContributor.name) {
                retString += translateContentFieldHelper(newContributor.name, locale);
            } else {
                retString += translateContentFieldHelper(newContributor as IStringMap, locale);
                // const textLangStr = convertMultiLangStringToLangString(stringMap, locale);
                // const textLang = textLangStr && textLangStr[0] ? textLangStr[0].toLowerCase() : "";
                // const textIsRTL = langStringIsRTL(textLang);
                // const textStr = textLangStr && textLangStr[1] ? textLangStr[1] : "";
            }
        }
    }

    return retString;
};
