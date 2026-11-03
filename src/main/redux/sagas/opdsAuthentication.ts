// ==LICENSE-BEGIN==
// Copyright 2026 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { customizationActions, toastActions, opdsActions, historyActions } from "readium-desktop/common/redux/actions";
import { ToastType } from "readium-desktop/common/models/toast";
import isURL from "readium-desktop/common/utils/isURL";
import { httpGet } from "readium-desktop/main/network/http";
import { diMainGet } from "readium-desktop/main/di";
import debug_ from "debug";
import { getTranslator } from "readium-desktop/common/services/translator";
import { call as callTyped, put as putTyped } from "typed-redux-saga/macro";
import { contentTypeisOpdsAuth, parseContentType } from "readium-desktop/utils/contentType";

import { findAllFeeds } from "./api/opds/feed";
import { IOpdsResultView } from "readium-desktop/common/views/opds";

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
        if (yield* showInlineAuthentication(result, catalogHref)) {
            return;
        }
        const authenticationEndpoint = result.links?.authenticationDocument?.[0]?.url || result.links?.bookshelf?.[0]?.url;
        if (!contentTypeisOpdsAuth(parseContentType(response.contentType)) && authenticationEndpoint
            && authenticationEndpoint !== url && isURL(authenticationEndpoint)) {
            const endpointResponse = yield* callTyped(() => httpGet(authenticationEndpoint));
            const endpointResult = yield* callTyped(() => service.opdsRequestTransformer(endpointResponse));
            if (!endpointResult) {
                throw new Error("Unable to load the OPDS authentication endpoint");
            }
            if (yield* showInlineAuthentication(endpointResult, catalogHref)) {
                return;
            }
        }
        yield* putTyped(opdsActions.refresh.build());
    } catch (e) {
        debug("OPDS authentication failed", e);
        yield* putTyped(toastActions.openRequest.build(ToastType.Error, getTranslator().translate("message.notifications.authenticationFailed")));
    }
}

function* showInlineAuthentication(result: IOpdsResultView, catalogHref: string) {
    if (!result.auth?.credentialsUrl) {
        return false;
    }
    const feeds = yield* callTyped(findAllFeeds, false);
    const feed = feeds.find(item => item.url === catalogHref);
    if (!feed) {
        return false;
    }
    yield* putTyped(historyActions.pushFeed.build({ ...feed, url: result.auth.credentialsUrl }));
    return true;
}
