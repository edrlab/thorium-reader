// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { LOCATION_CHANGE, LocationChangeAction } from "connected-react-router";
import * as debug_ from "debug";
import { apiActions } from "readium-desktop/common/redux/actions";
import { takeTyped } from "readium-desktop/common/redux/typed-saga";
import { TApiMethod } from "readium-desktop/main/api/api.type";
// import { getSearchUrlFromOpdsLinks } from "readium-desktop/renderer/opds/search/search";
import { opdsActions } from "readium-desktop/renderer/redux/actions";
import { parseOpdsBrowserRoute } from "readium-desktop/renderer/utils";
import { ReturnPromiseType } from "readium-desktop/typings/promise";
import { SagaIterator } from "redux-saga";
import { all, call, put, take } from "redux-saga/effects";

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
            yield put(opdsActions.browseRequest.build(parsedResult.level, parsedResult.title, parsedResult.url));
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

                const putLinks = {
                    start: links.start[0]?.url,
                    up: links.up[0]?.url,
                    bookshelf: links.bookshelf[0]?.url,
                    self: links.self[0]?.url,
                };
                debug("opds browse data received with feed links", putLinks);

                yield put(opdsActions.headerLinksUpdate.build(putLinks));

                // non-blocking searchUrl request
                // yield fork(setSearchLinkInHeader, links.search);
            }
        }
    }
}

/*
// move to back
function* setSearchLinkInHeader(link: IOpdsLinkView[]): SagaIterator {
    const linkUrl = yield* callTyped(getSearchUrlFromOpdsLinks, link);
    yield put(opdsActions.headerLinksUpdate.build({
        search: linkUrl,
    }));
}
*/

export function* watchers() {
    yield all([
        call(browseWatcher),
        call(browseRequestWatcher),
        call(updateHeaderLinkWatcher),
    ]);
}
