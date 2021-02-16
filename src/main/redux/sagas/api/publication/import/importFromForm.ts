// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { callTyped } from "readium-desktop/common/redux/sagas/typed-saga";
import { IOpdsLinkView } from "readium-desktop/common/views/opds";
import { PublicationDocument } from "readium-desktop/main/db/document/publication";
import { SagaGenerator } from "typed-redux-saga";
import { importFromLinkService } from "./importFromLink";

// Logger
const debug = debug_("readium-desktop:main#saga/api/publication/importFromStringService");

export function* importFromFormService(
    requestData: any,
): SagaGenerator<[publicationDoc: PublicationDocument, alreadyImported: boolean]> {

    // doing something with data
    debug("@@@@@@@@@@@@22");

    debug("REQUEST FROM IMPORT FROM FORM");

    debug(requestData);

    debug("@@@@@@@@@@@@22");

    const { data } = requestData;

    const { url, title, des, author, cover, reading } = data;

    if (url) {
        const link: IOpdsLinkView = {
            url,
        };

        return yield* callTyped(importFromLinkService, link);
    }
    return [undefined, false];
}
