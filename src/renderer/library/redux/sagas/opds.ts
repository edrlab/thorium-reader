// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { TApiMethod } from "readium-desktop/common/api/api.type";
import { apiActions } from "readium-desktop/common/redux/actions";
import { takeSpawnEvery } from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { raceTyped, selectTyped } from "readium-desktop/common/redux/sagas/typed-saga";
import { IOpdsLinkView, THttpGetOpdsResultView } from "readium-desktop/common/views/opds";
import { apiSaga } from "readium-desktop/renderer/common/redux/sagas/api";
import { opdsBrowse } from "readium-desktop/renderer/common/redux/sagas/opdsBrowse";
import { parseOpdsBrowserRoute } from "readium-desktop/renderer/library/opds/route";
import { opdsActions, routerActions } from "readium-desktop/renderer/library/redux/actions";
import { ILibraryRootState } from "readium-desktop/renderer/library/redux/states";
import { TReturnPromiseOrGeneratorType } from "readium-desktop/typings/api";
import { ContentType } from "readium-desktop/utils/contentType";
import { call, put, take } from "redux-saga/effects";
import { delay } from "typed-redux-saga";

export const BROWSE_OPDS_API_REQUEST_ID = "browseOpdsApiResult";
export const SEARCH_OPDS_API_REQUEST_ID = "searchOpdsApiResult";
export const SEARCH_TERM = "{searchTerms}";

// Logger
const debug = debug_("readium-desktop:renderer:redux:saga:opds");

// https://reacttraining.com/react-router/web/api/withRouter
// withRouter does not subscribe to location changes like React Redux’s connect does for state changes.
// Instead, re-renders after location changes propagate out from the <Router> component.
// This means that withRouter does not re-render on route transitions unless its parent component re-renders.
function* browseWatcher(action: routerActions.locationChanged.TAction) {
    const path = action.payload.location.pathname;

    if (path.startsWith("/opds") && path.indexOf("/browse") > 0) {
        const parsedResult = parseOpdsBrowserRoute(path);
        parsedResult.title = decodeURI(parsedResult.title);
        debug("request opds browse", parsedResult);

        // re-render opds navigator
        yield put(
            opdsActions.browseRequest.build(
                parsedResult.rootFeedIdentifier,
                parsedResult.level,
                parsedResult.title,
                parsedResult.url,
            ));

        yield put(apiActions.clean.build(BROWSE_OPDS_API_REQUEST_ID));

        const url = parsedResult.url;
        debug("opds browse url=", url);
        const { b: opdsBrowseAction } = yield* raceTyped({
            a: delay(5000),
            b: call(opdsBrowse, url, BROWSE_OPDS_API_REQUEST_ID),
        });

        if (!opdsBrowseAction) {
            debug("opds browse url=", url, "timeout 5s");
            return;
        }

        debug("opds browse data received");
        yield call(updateHeaderLinkWatcher, opdsBrowseAction);
    }
}

function* updateHeaderLinkWatcher(action: apiActions.result.TAction<THttpGetOpdsResultView>) {

    const httpRes = action.payload;
    const opdsResultView = httpRes.data;
    // debug("opdsResult:", opdsResultView); large dump!

    if (httpRes?.isSuccess && opdsResultView) {

        const links = opdsResultView.links;
        if (links) {
            const putLinks = {
                start: links.start[0]?.url,
                up: links.up[0]?.url,
                bookshelf: links.bookshelf[0]?.url,
                self: links.self[0]?.url,
            };
            debug("opds browse data received with feed links", putLinks);
            yield put(opdsActions.headerLinksUpdate.build(putLinks));

            if (links.search?.length) {

                const { b: getUrlAction } = yield* raceTyped({
                    a: delay(5000),
                    b: call(getUrlApi, links.search),
                });

                if (!getUrlAction) {
                    debug("opds browse url=", links.search, "timeout 5s");
                    return;
                }

                yield call(setSearchLinkInHeader, getUrlAction);
            }
        }
    }
}

function* getUrlApi(links: IOpdsLinkView[]) {

    yield apiSaga("opds/getUrlWithSearchLinks", SEARCH_OPDS_API_REQUEST_ID, links);
    while (true) {
        const action:
            apiActions.result.TAction<TReturnPromiseOrGeneratorType<TApiMethod["opds/getUrlWithSearchLinks"]>>
            = yield take(apiActions.result.build);

        const { requestId } = action.meta.api;
        if (requestId === SEARCH_OPDS_API_REQUEST_ID) {
            return action;
        }
    }
}

function* setSearchLinkInHeader(action: apiActions.result.TAction<string>) {

    const searchRaw = action.payload;
    debug("opds search raw data received", searchRaw);

    let returnUrl: string;
    try {
        if (new URL(searchRaw)) {
            returnUrl = searchRaw;
        }
    } catch (err) {
        try {
            const xmlDom = (new DOMParser()).parseFromString(searchRaw, ContentType.TextXml);
            const urlsElem = xmlDom.documentElement.querySelectorAll("Url");

            for (const urlElem of urlsElem.values()) {
                const type = urlElem.getAttribute("type");

                if (type && type.includes(ContentType.AtomXml)) {
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

    if (returnUrl) {
        debug("opds searchUrl data received", returnUrl);
        yield put(
            opdsActions.search.build(
                {
                    url: returnUrl,
                    level: returnUrl
                        ? yield* selectTyped(
                            (state: ILibraryRootState) => state.opds.browser.breadcrumb.length)
                        : undefined,
                },
            ));

    }
}

export function saga() {
    // listen on router location and trigger only on opds browse route
    return takeSpawnEvery(
        routerActions.locationChanged.ID,
        browseWatcher,
        (e) => debug(e),
    );
}
