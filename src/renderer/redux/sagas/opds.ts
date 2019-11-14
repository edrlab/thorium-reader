// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { LOCATION_CHANGE, LocationChangeAction } from "connected-react-router";
import * as debug_ from "debug";
import { apiActions } from "readium-desktop/common/redux/actions";
import { TOpdsLinkViewSimplified } from "readium-desktop/common/views/opds";
import { TApiMethod } from "readium-desktop/main/api/api.type";
import { getSearchUrlFromOpdsLinks } from "readium-desktop/renderer/opds/search/search";
import { opdsActions } from "readium-desktop/renderer/redux/actions";
import { parseOpdsBrowserRoute } from "readium-desktop/renderer/utils";
import { ReturnPromiseType } from "readium-desktop/typings/promise";
import { SagaIterator } from "redux-saga";
import { all, call, fork, put, take } from "redux-saga/effects";

export const BROWSE_OPDS_API_REQUEST_ID = "browseOpdsApiResult";

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
            yield put(opdsActions.browse(parsedResult));
            yield put(apiActions.clean(BROWSE_OPDS_API_REQUEST_ID));
        }
    }
}

function* browseRequestWatcher(): SagaIterator {
    while (true) {
        const action: opdsActions.IActionBrowseRequest =
            yield take(opdsActions.ActionType.BrowseRequest);
        debug("opds browse catched");
        yield put(
            apiActions.buildRequestAction(
                BROWSE_OPDS_API_REQUEST_ID,
                "opds", "browse",
                [action.payload.url]));
    }
}

function* updateHeaderLinkWatcher(): SagaIterator {
    while (true) {
        const action: apiActions.ApiAction = yield take(apiActions.ActionType.Result);
        const { requestId } = action.meta.api;

        if (requestId === BROWSE_OPDS_API_REQUEST_ID) {
            debug("opds browse data received");
            const browserResult = action.payload as ReturnPromiseType<TApiMethod["opds/browse"]>;

            if (browserResult.isSuccess && browserResult.data && browserResult.data.links) {
                const links = browserResult.data.links;
                const findLink = (ln: TOpdsLinkViewSimplified[]) => ln && ln.find((link) =>
                    link.TypeLink.includes("application/atom+xml"));

                const linkViewStart = findLink(links.start);
                const linkViewUp = findLink(links.up);
                const linkViewBookshelf = findLink(links.bookshelf);
                const linkViewSelf = findLink(links.self);

                const putLinks = {
                    start: linkViewStart && linkViewStart.Href,
                    up: linkViewUp && linkViewUp.Href,
                    bookshelf: linkViewBookshelf && linkViewBookshelf.Href,
                    self: linkViewSelf && linkViewSelf.Href,
                };
                debug("opds browse data received with feed links", putLinks);

                yield put(opdsActions.headerLinkUpdate(putLinks));

                // non-blocking searchUrl request
                yield fork(setSearchLinkInHeader, links.search);
            }
        }
    }
}

function* setSearchLinkInHeader(link: TOpdsLinkViewSimplified[]): SagaIterator {
    const linkUrl: string | undefined = yield call(getSearchUrlFromOpdsLinks, link);
    yield put(opdsActions.headerLinkUpdate({
        search: linkUrl,
    }));
}

export function* watchers() {
    yield all([
        call(browseWatcher),
        call(browseRequestWatcher),
        call(updateHeaderLinkWatcher),
    ]);
}
