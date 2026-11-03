// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { URL_HOST_OPDS_AUTH, URL_PROTOCOL_OPDS } from "readium-desktop/common/streamerProtocol";
import type { TregisterHttpProtocolHandler } from "readium-desktop/main/redux/sagas/getEventChannel";

let receiver: ((event: TregisterHttpProtocolHandler) => void) | undefined;

// Bridge OS deep links into the same channel as the in-app browser's protocol handler.
export function subscribeToOpdsAuthenticationRedirects(listener: (event: TregisterHttpProtocolHandler) => void) {
    if (receiver) throw new Error("OPDS authentication redirect receiver already registered");
    receiver = listener;
    return () => {
        if (receiver === listener) receiver = undefined;
    };
}

export function forwardOpdsAuthenticationRedirect(url: string): boolean {
    try {
        const parsed = new URL(url);
        if (parsed.protocol !== URL_PROTOCOL_OPDS + ":" || parsed.host !== URL_HOST_OPDS_AUTH) return false;
    } catch {
        return false;
    }
    if (!receiver) return false;
    receiver({
        request: { url, method: "GET", referrer: "", headers: {} },
        // OS deep links have no pending Electron protocol response to acknowledge.
        callback: () => { /* No transport response. */ },
    });
    return true;
}
