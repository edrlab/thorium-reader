// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { TApiMethod } from "readium-desktop/common/api/api.type";
import { apiActions } from "readium-desktop/common/redux/actions";
import { TReturnPromiseOrGeneratorType } from "readium-desktop/typings/api";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { take } from "redux-saga/effects";

import { apiSaga } from "./api";

// Logger
const filename_ = "readium-desktop:renderer:redux:saga:opds-browse";
const debug = debug_(filename_);

type TA = apiActions.result.TAction<TReturnPromiseOrGeneratorType<TApiMethod["httpbrowser/browse"]>>;

export function* opdsBrowse(link: string, REQUEST_ID: string) {

    debug("opds-browse", link);
    yield apiSaga("httpbrowser/browse", REQUEST_ID, link);
    while (true) {
        const action: TA = yield take(apiActions.result.build);

        const { requestId } = action.meta.api;
        if (requestId === REQUEST_ID) {
            debug("opds-browse action-received", action);
            return action;
        }
    }
}
