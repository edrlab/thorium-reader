// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { OpdsFeed } from "readium-desktop/common/models/opds";
import {
    IOpdsFeedView, IOpdsLinkView, THttpGetOpdsResultView,
} from "readium-desktop/common/views/opds";

// quite useless
export type TOpdsLinkSearch = Required<Pick<IOpdsLinkView, "url">>;

export interface IOpdsApi {
    getFeed: (
        identifier: string,
    ) => Promise<IOpdsFeedView>;
    deleteFeed: (
        identifier: string,
    ) => Promise<void>;
    findAllFeeds: (
    ) => Promise<IOpdsFeedView[]>;
    addFeed: (
        data: OpdsFeed,
    ) => Promise<IOpdsFeedView>;
    // updateFeed: (
    //     data: OpdsFeed,
    // ) => Promise<IOpdsFeedView>;
    browse: (
        url: string,
    ) => Promise<THttpGetOpdsResultView>;
    getUrlWithSearchLinks: (
        searchLink: TOpdsLinkSearch[] | TOpdsLinkSearch,
    ) => Promise<string | undefined>;
}

export interface IOpdsModuleApi {
    "opds/getFeed": IOpdsApi["getFeed"];
    "opds/deleteFeed": IOpdsApi["deleteFeed"];
    "opds/findAllFeeds": IOpdsApi["findAllFeeds"];
    "opds/addFeed": IOpdsApi["addFeed"];
    // "opds/updateFeed": IOpdsApi["updateFeed"];
    "opds/browse": IOpdsApi["browse"];
    "opds/getUrlWithSearchLinks": IOpdsApi["getUrlWithSearchLinks"];
}
