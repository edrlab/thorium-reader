// ==LICENSE-BEGIN==
// Copyright 2026 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import type { IOpdsApi } from "readium-desktop/common/api/interface/opdsApi.interface";
import { diMainGet } from "readium-desktop/main/di";
import { getOpdsUserProfile } from "readium-desktop/main/services/opdsUserProfile";
import { call } from "typed-redux-saga/macro";

export const getUserProfile: IOpdsApi["getUserProfile"] = function* (identifier) {
    const repository = diMainGet("opds-feed-repository");
    const feed = yield* call(() => repository.get(identifier));
    return yield* call(getOpdsUserProfile, feed.url, feed.authenticationUrl);
};
