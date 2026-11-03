// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { channel } from "redux-saga";
import { authActions } from "readium-desktop/common/redux/actions";
import { getOpdsAuthenticationChannel } from "readium-desktop/main/event";
import type { OPDSAuthenticationDoc } from "@r2-opds-js/opds/opds2/opds2-authentication-doc";
import { race as raceTyped, take as takeTyped } from "typed-redux-saga/macro";

export function* requestOpdsAuthentication(doc: OPDSAuthenticationDoc, url: string) {
    // Buffer the signal: replacement can happen before the caller starts waiting.
    // Each request owns its channel, even when several downloads share a URL.
    const interrupted = channel<true>();
    try {
        getOpdsAuthenticationChannel().put([doc, url, false, () => interrupted.put(true)]);
        const { done } = yield* raceTyped({
            cancel: takeTyped(authActions.cancel.build),
            done: takeTyped(authActions.done.build),
            interrupted: takeTyped(interrupted),
        });
        return !!done;
    } finally {
        interrupted.close();
    }
}
