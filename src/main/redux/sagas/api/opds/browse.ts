// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==
/*

    public async browse(url: string): Promise<THttpGetOpdsResultView> {
        url = checkUrl(url);

        return this.opdsService.opdsRequest(url);
    }
 */

import { TOpdsLinkSearch } from "readium-desktop/common/api/interface/opdsApi.interface";
import { THttpGetOpdsResultView } from "readium-desktop/common/views/opds";
import { diMainGet } from "readium-desktop/main/di";
import { OpdsService } from "readium-desktop/main/services/opds";
import { call, SagaGenerator } from "typed-redux-saga/dist";

const checkUrl = (url: string) => {
    try {
        if (new URL(url).protocol === "opds:") {
            url = url.replace("opds://", "http://");
        }
    } catch (e) {
        throw new Error(`opds-api-url-invalid ${e.message}`);
    }
    return url;
};

export function* browse(url: string): SagaGenerator<THttpGetOpdsResultView> {
    const urlChecked = checkUrl(url);

    const opdsService: OpdsService = diMainGet("opds-service");

    return yield* call(() => opdsService.opdsRequest(urlChecked));
}

export function* getUrlWithSearchLinks(searchLink: TOpdsLinkSearch[] | TOpdsLinkSearch): SagaGenerator<string | undefined> {

    const opdsService: OpdsService = diMainGet("opds-service");

    const link = Array.isArray(searchLink) ? searchLink : [searchLink];
    return yield* call(() => opdsService.parseOpdsSearchUrl(link));
}
