// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Translator } from "readium-desktop/common/services/translator";
import { IOpdsContributorView } from "readium-desktop/common/views/opds";

export const formatContributorToString = (
    contributors: string[] | IOpdsContributorView[] | undefined,
    translator: Translator): string => {

    let retString = "";

    if (Array.isArray(contributors)) {

        for (const contributor of contributors) {
            const newContributor = contributor;
            if (retString !== "") {
                retString += ", ";
            }

            if (typeof newContributor === "string") {
                retString += translator.translateContentField(newContributor);
            } else {
                retString += translator.translateContentField(newContributor.name);
            }
        }
    }

    return retString;
};
