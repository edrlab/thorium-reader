// ==LICENSE-BEGIN==
// Copyright 2026 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import type { IOpdsApi } from "readium-desktop/common/api/interface/opdsApi.interface";
import { diMainGet } from "readium-desktop/main/di";
import { getOpdsBrowserOptions } from "readium-desktop/main/services/opdsBrowserOptions";
import { logoutOpdsCatalog } from "readium-desktop/main/services/opdsLogout";
import { call, put } from "typed-redux-saga/macro";
import { opdsActions } from "readium-desktop/common/redux/actions";

export const getBrowserOptions: IOpdsApi["getBrowserOptions"] = function* (identifier, currentUrl, bookshelfUrl) {
    const feed = yield* call(() => diMainGet("opds-feed-repository").get(identifier));
    return yield* call(getOpdsBrowserOptions, feed.url, currentUrl, feed.authenticationUrl, bookshelfUrl);
};

export const logoutCatalog: IOpdsApi["logoutCatalog"] = function* (identifier, currentUrl) {
    const feed = yield* call(() => diMainGet("opds-feed-repository").get(identifier));
    yield* call(logoutOpdsCatalog, feed.url, currentUrl);
    yield* put(opdsActions.refresh.build());
};
