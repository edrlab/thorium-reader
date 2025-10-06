// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { opdsCommonActions } from "readium-desktop/common/redux/actions";
import { takeSpawnLeading } from "readium-desktop/common/redux/sagas/takeSpawnLeading";
import { error } from "readium-desktop/main/tools/error";
import { deleteAuthenticationToken, getAuthenticationToken } from "readium-desktop/main/network/http";
import { call as callTyped } from "typed-redux-saga/macro";

// Logger
const filename_ = "readium-desktop:main:saga:opds";
const debug = debug_(filename_);
debug("_");


export function saga() {
    return takeSpawnLeading(
        opdsCommonActions.logout.ID,
        function* (action: opdsCommonActions.logout.TAction) {
            const feedUrl = action.payload.url;
            let catalogLinkUrl: URL;
            try {
                catalogLinkUrl = (new URL(feedUrl));
            } catch {
                // nothing
            }
            if (!catalogLinkUrl) {
                debug("No catalogLinkUrl found, return");
            }
            yield* callTyped(() => deleteAuthenticationToken(catalogLinkUrl.host));
            const authToken = yield* callTyped(() => getAuthenticationToken(catalogLinkUrl));
            if (authToken?.accessToken) {
                debug("ERROR to Logout of the feed:", feedUrl);
            } else {
                debug("LOGOUT from:", feedUrl);
            }
        },
        (e) => error(filename_, e),
    );
}
