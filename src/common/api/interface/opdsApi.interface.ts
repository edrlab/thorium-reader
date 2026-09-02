// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { OpdsFeed } from "readium-desktop/common/models/opds";
import {
    IOpdsFeedView, IOpdsLinkView,
} from "readium-desktop/common/views/opds";
import { SagaGenerator } from "typed-redux-saga";

// quite useless
export type TOpdsLinkSearch = Required<Pick<IOpdsLinkView, "url">>;

export interface IOpdsApi {
    getFeed: (
        identifier: string,
    ) => SagaGenerator<IOpdsFeedView>;
    deleteFeed: (
        identifier: string,
    ) => SagaGenerator<void>;
    findAllFeeds: (
    ) => SagaGenerator<IOpdsFeedView[]>;
    addFeed: (
        data: OpdsFeed,
    ) => SagaGenerator<IOpdsFeedView>;
    // updateFeed: (
    //     data: OpdsFeed,
    // ) => Promise<IOpdsFeedView>;
    getUrlWithSearchLinks: (
        searchLink: TOpdsLinkSearch[] | TOpdsLinkSearch,
    ) => SagaGenerator<string | undefined>;
}

export interface IOpdsModuleApi {
    "opds/getFeed": IOpdsApi["getFeed"];
    "opds/deleteFeed": IOpdsApi["deleteFeed"];
    "opds/findAllFeeds": IOpdsApi["findAllFeeds"];
    "opds/addFeed": IOpdsApi["addFeed"];
    // "opds/updateFeed": IOpdsApi["updateFeed"];
    "opds/getUrlWithSearchLinks": IOpdsApi["getUrlWithSearchLinks"];
}
