// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { DialogTypeName } from "readium-desktop/common/models/dialog";
import { lcpActions } from "readium-desktop/common/redux/actions";
import { dialogActions } from "readium-desktop/common/redux/actions/";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { put, takeEvery } from "redux-saga/effects";

function* lcpUserKeyCheckRequest(action: lcpActions.userKeyCheckRequest.TAction) {
    const { hint, urlHint, publicationView, message } = action.payload;

    // will call API.unlockPublicationWithPassphrase()
    yield put(dialogActions.openRequest.build(
        DialogTypeName.LcpAuthentication,
        {
            publicationView,
            hint,
            urlHint,
            message,
        },
    ));
}

export function saga() {
    return takeEvery(
        lcpActions.userKeyCheckRequest.ID,
        lcpUserKeyCheckRequest,
    );
}
