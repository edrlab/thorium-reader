// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { LOCATION_CHANGE, LocationChangeAction } from "connected-react-router";
import * as debug_ from "debug";
import { apiActions } from "readium-desktop/common/redux/actions";
import { selectTyped, takeTyped } from "readium-desktop/common/redux/typed-saga";
import { TApiMethod } from "readium-desktop/main/api/api.type";
import { opdsActions } from "readium-desktop/renderer/redux/actions";
import { RootState } from "readium-desktop/renderer/redux/states";
import { parseOpdsBrowserRoute } from "readium-desktop/renderer/utils";
import { ReturnPromiseType } from "readium-desktop/typings/promise";
import { SagaIterator } from "redux-saga";
import { all, call, fork, put, take } from "redux-saga/effects";

export const BROWSE_OPDS_API_REQUEST_ID = "browseOpdsApiResult";
export const SEARCH_OPDS_API_REQUEST_ID = "searchOpdsApiResult";
export const SEARCH_TERM = "{searchTerms}";

// Logger
const debug = debug_("readium-desktop:renderer:redux:saga:opds");

// https://reacttraining.com/react-router/web/api/withRouter
// tslint:disable-next-line: max-line-length
// withRouter does not subscribe to location changes like React Redux’s connect does for state changes. Instead, re-renders after location changes propagate out from the <Router> component. This means that withRouter does not re-render on route transitions unless its parent component re-renders.
function* browseWatcher(): SagaIterator {
    while (true) {
        const result: LocationChangeAction = yield take(LOCATION_CHANGE);
        const path = result.payload.location.pathname;

        if (path.startsWith("/opds") && path.indexOf("/browse") > 0 ) {
            const parsedResult = parseOpdsBrowserRoute(path);
            parsedResult.title = decodeURI(parsedResult.title);
            debug("request opds browse", parsedResult);
            yield put(opdsActions.browseRequest.build(
                parsedResult.rootFeedIdentifier,
                parsedResult.level,
                parsedResult.title,
                parsedResult.url));
            yield put(apiActions.clean.build(BROWSE_OPDS_API_REQUEST_ID));
        }
    }
}

function* browseRequestWatcher(): SagaIterator {
    while (true) {
        const action = yield* takeTyped(opdsActions.browseRequest.build);
        debug("opds browse catched");
        yield put(
            apiActions.request.build(
                BROWSE_OPDS_API_REQUEST_ID,
                "opds", "browse",
                [action.payload.url]));
    }
}

function* updateHeaderLinkWatcher(): SagaIterator {
    while (true) {
        const action = yield* takeTyped(apiActions.result.build);
        const { requestId } = action.meta.api;

        if (requestId === BROWSE_OPDS_API_REQUEST_ID) {
            debug("opds browse data received");

            const browserResult = action.payload as ReturnPromiseType<TApiMethod["opds/browse"]>;

            if (browserResult.isSuccess && browserResult.data && browserResult.data.links) {
                const links = browserResult.data.links;

                debug("opdsResult:", browserResult.data);

                const putLinks = {
                    start: links.start[0]?.url,
                    up: links.up[0]?.url,
                    bookshelf: links.bookshelf[0]?.url,
                    self: links.self[0]?.url,
                };
                debug("opds browse data received with feed links", putLinks);
                yield put(opdsActions.headerLinksUpdate.build(putLinks));

                if (links.search && links.search.length) {
                    yield put(
                        apiActions.request.build(
                            SEARCH_OPDS_API_REQUEST_ID,
                            "opds", "getUrlWithSearchLinks",
                            [links.search]));
                    // non-blocking getUrlWithSearchLinks search request
                    yield fork(setSearchLinkInHeader);
                }
            }
        }
    }
}

function* setSearchLinkInHeader(): SagaIterator {

    const action = yield* takeTyped(apiActions.result.build);
    const { requestId } = action.meta.api;
    let returnUrl: string;

    if (requestId === SEARCH_OPDS_API_REQUEST_ID) {

        const searchRaw = action.payload as ReturnPromiseType<TApiMethod["opds/getUrlWithSearchLinks"]>;

        debug("opds search raw data received", searchRaw);

        try {
            if (new URL(searchRaw)) {
                returnUrl = searchRaw;
            }
        } catch (err) {
            try {
                const xmlDom = (new DOMParser()).parseFromString(searchRaw, "text/xml");
                const urlsElem = xmlDom.documentElement.querySelectorAll("Url");

                for (const urlElem of urlsElem.values()) {
                    const type = urlElem.getAttribute("type");

                    if (type && type.includes("application/atom+xml")) {
                        const searchUrl = urlElem.getAttribute("template");
                        const url = new URL(searchUrl);

                        if (url.search.includes(SEARCH_TERM) || url.pathname.includes(SEARCH_TERM)) {

                            // remove search filter not handle yet
                            let searchLink = searchUrl.replace("{atom:author}", "");
                            searchLink = searchLink.replace("{atom:contributor}", "");
                            searchLink = searchLink.replace("{atom:title}", "");

                            returnUrl = searchLink;

                        }
                    }
                }
            } catch (errXml) {
                debug("error to parse searchRaw (xml or url)");
            }
        }

        debug("opds searchUrl data received", returnUrl);
        yield put(opdsActions.search.build({
            url: returnUrl,
            level: returnUrl ? yield* selectTyped(
                (state: RootState) => state.opds.browser.breadcrumb.length) : undefined,
        }));
    }
}

export function* watchers() {
    yield all([
        call(browseWatcher),
        call(browseRequestWatcher),
        call(updateHeaderLinkWatcher),
    ]);
}
