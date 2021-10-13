// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { TOpdsLinkSearch } from "readium-desktop/common/api/interface/opdsApi.interface";
import { diMainGet } from "readium-desktop/main/di";
import { OpdsService } from "readium-desktop/main/services/opds";
import { call, SagaGenerator } from "typed-redux-saga";

export function* getUrlWithSearchLinks(searchLink: TOpdsLinkSearch[] | TOpdsLinkSearch): SagaGenerator<string | undefined> {

    const opdsService: OpdsService = diMainGet("opds-service");

    const link = Array.isArray(searchLink) ? searchLink : [searchLink];
    return yield* call(() => opdsService.parseOpdsSearchUrl(link));
}
