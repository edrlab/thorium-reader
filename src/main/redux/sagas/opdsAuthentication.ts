// ==LICENSE-BEGIN==
// Copyright 2026 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { customizationActions, toastActions, opdsActions } from "readium-desktop/common/redux/actions";
import { ToastType } from "readium-desktop/common/models/toast";
import isURL from "readium-desktop/common/utils/isURL";
import { httpGet } from "readium-desktop/main/network/http";
import { diMainGet } from "readium-desktop/main/di";
import debug_ from "debug";
import { call as callTyped, put as putTyped } from "typed-redux-saga/macro";
import { contentTypeisOpdsAuth, parseContentType } from "readium-desktop/utils/contentType";

const debug = debug_("readium-desktop:main:redux:sagas:opdsAuthentication");

export function* triggerCatalogOpdsAuthentication(action: customizationActions.triggerOpdsAuth.TAction) {
    const { opdsAuthenticationHref, catalogHref } = action.payload;
    try {
        const url = opdsAuthenticationHref || catalogHref;
        if (!url || !isURL(url)) {
            throw new Error("Invalid OPDS authentication URL");
        }
        // The bookshelf may return an authentication document, an HTTP challenge,
        // or a feed. Let the normal OPDS response handler distinguish these cases.
        const response = yield* callTyped(() => httpGet(url));
        const service = diMainGet("opds-service");
        const result = yield* callTyped(() => service.opdsRequestTransformer(response));
        if (!result) {
            throw new Error("Unable to load the OPDS authentication endpoint");
        }
        const bookshelf = result.links?.authenticate?.[0]?.url || result.links?.bookshelf?.[0]?.url;
        if (!contentTypeisOpdsAuth(parseContentType(response.contentType)) && bookshelf && bookshelf !== url && isURL(bookshelf)) {
            const shelfResponse = yield* callTyped(() => httpGet(bookshelf));
            const shelfResult = yield* callTyped(() => service.opdsRequestTransformer(shelfResponse));
            if (!shelfResult) {
                throw new Error("Unable to load the OPDS bookshelf authentication endpoint");
            }
        }
        yield* putTyped(opdsActions.refresh.build());
    } catch (e) {
        debug("OPDS authentication failed", e);
        yield* putTyped(toastActions.openRequest.build(ToastType.Error, String(e)));
    }
}

