// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";
import { shell } from "electron";
import { goBack, push, replace } from "redux-first-history";
import { catalogAnalyticsEvents } from "readium-desktop/common/analytics/catalog";
import { TApiMethod } from "readium-desktop/common/api/api.type";
import { apiActions, authActions, historyActions } from "readium-desktop/common/redux/actions";
import { takeSpawnEvery } from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { removeUTF8BOM } from "readium-desktop/common/utils/bom";
import { tryDecodeURIComponent } from "readium-desktop/common/utils/uri";
import { IOpdsLinkView, OPDS_OPEN_SEARCH_DATA_SEPARATOR } from "readium-desktop/common/views/opds";
import { THttpGetBrowserResultView } from "readium-desktop/common/views/browser";
import { apiSaga } from "readium-desktop/renderer/common/redux/sagas/api";
import { opdsBrowse } from "readium-desktop/renderer/common/redux/sagas/httpBrowser";
import { buildOpdsBrowserRoute, parseOpdsBrowserRoute } from "readium-desktop/renderer/library/opds/route";
import { opdsActions, routerActions } from "readium-desktop/renderer/library/redux/actions";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import { TReturnPromiseOrGeneratorType } from "readium-desktop/typings/api";
import { ContentType, parseContentType } from "readium-desktop/utils/contentType";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { all, call, delay, put, spawn, take } from "redux-saga/effects";
import { race as raceTyped, select as selectTyped } from "typed-redux-saga/macro";
import { IOpdsHeaderState } from "readium-desktop/common/redux/states/renderer/opds";
import { logEvent } from "readium-desktop/renderer/common/analytics";
import { BROWSE_OPDS_API_REQUEST_ID } from "readium-desktop/renderer/library/opds/constants";
import { handOffBrowseResponse, takeBrowseResponse } from "readium-desktop/renderer/library/opds/browseResponse";

export const SEARCH_OPDS_API_REQUEST_ID = "searchOpdsApiResult";
export const SEARCH_TERM = "{searchTerms}";

// Logger
const debug = debug_("readium-desktop:renderer:redux:saga:opds");

// https://reacttraining.com/react-router/web/api/withRouter
// withRouter (ReactRouter v5, deprecated in v6 in favour of hooks useLocation(), useNavigate(), and useParams())
// does not subscribe to location changes like React Redux’s connect does for state changes.
// Instead, re-renders after location changes propagate out from the <Router> component.
// This means that withRouter does not re-render on route transitions unless its parent component re-renders.
export function* browseWatcher(action: routerActions.locationChanged.TAction) {
    const path = action.payload.location.pathname;

    // reset on each opds navigation, already set up previously but only when accessing the opds flow not on the catalog list.
    // Reset useful here when accessing an authenticated flow without concretely authenticating this flow (transitive state).
    // Header links are no longer updated by accumulation based on the links browsed but by set and replace each time an opds page is discovered (stateless).
    if (path.startsWith("/opds")) {
        // reset
        yield put(opdsActions.headerLinksUpdate.build({
        }));
        yield put(opdsActions.search.build({
        }));
    }

    if (path.startsWith("/opds") && path.indexOf("/browse") > 0) {
        const parsedResult = parseOpdsBrowserRoute(path);
        debug("request opds browse", path, parsedResult);
        if (!parsedResult) {
            debug("Invalid OPDS browse route", path);
            yield put(replace("/opds"));
            return;
        }
        // parsedResult.title can for example be a search terms "この世界の謎 %2F %20 % ?abc=def&zz=yyé"
        // which is escaped by encodeURIComponent() to
        // %E3%81%93%E3%81%AE%E4%B8%96%E7%95%8C%E3%81%AE%E8%AC%8E%20%252F%20%2520%20%25%20%3Fabc%3Ddef%26zz%3Dyy%C3%A9
        // (and passed to search URL as query param or path segment)
        // TODO: the decodeURIComponent() is not necessary for search, but is it for other cases?
        // (this is why tryDecodeURIComponent() is used instead,
        // otherwise crash if string contains percent char not used for escaping)
        const newParsedResultTitle = tryDecodeURIComponent(parsedResult.title);
        debug(newParsedResultTitle);

        // re-render opds navigator
        yield put(
            opdsActions.browseRequest.build(
                parsedResult.rootFeedIdentifier,
                parsedResult.level,
                newParsedResultTitle,
                parsedResult.url,
            ));

        yield put(apiActions.clean.build(BROWSE_OPDS_API_REQUEST_ID));

        const url = parsedResult.url;
        debug("opds browse url=", url);
        const response = takeBrowseResponse(path);
        let opdsBrowseAction: apiActions.result.TAction<THttpGetBrowserResultView>;
        if (response) {
            opdsBrowseAction = apiActions.result.build({
                requestId: BROWSE_OPDS_API_REQUEST_ID, moduleId: "httpbrowser", methodId: "browse",
            }, response);
            yield put(opdsBrowseAction);
        } else {
            ({ b: opdsBrowseAction } = yield* raceTyped({
                a: delay(20000),
                b: call(opdsBrowse, url, BROWSE_OPDS_API_REQUEST_ID),
            }));
        }

        if (!opdsBrowseAction) {
            debug("browseWatcher timeout?", url);
            return;
        }

        debug("opds browse data received");
        if (!opdsBrowseAction.payload.isFailure && parsedResult.level === 1) {
            yield spawn(function*() {
                yield call(logEvent, catalogAnalyticsEvents.browse);
            });
        }

        if (
            opdsBrowseAction.payload.isSuccess &&
            parseContentType(opdsBrowseAction.payload.contentType) === ContentType.Html
        ) {
            const externalUrl = opdsBrowseAction.payload.responseUrl || url;
            try {
                const parsedExternalUrl = new URL(externalUrl);
                if (parsedExternalUrl.protocol !== "http:" && parsedExternalUrl.protocol !== "https:") {
                    throw new Error(`Unsupported Web Catalog URL protocol: ${parsedExternalUrl.protocol}`);
                }
                yield call(() => shell.openExternal(parsedExternalUrl.toString()));
            } finally {
                yield put(replace("/opds"));
            }
            return;
        }

        yield call(updateHeaderLinkWatcher, opdsBrowseAction);
    }
}

function* updateHeaderLinkWatcher(action: apiActions.result.TAction<THttpGetBrowserResultView>) {

    if (action.payload.isFailure) return;
    if (typeof action.payload?.data?.opds?.links !== "object") return;

    const { payload: { data: { opds: { links, title } } } } = action;
    if (links) {
        const putLinks: IOpdsHeaderState = {
            start: links.start[0]?.url,
            up: links.up[0]?.url,
            bookshelf: links.bookshelf[0]?.url,
            self: links.self[0]?.url,
            title,
        };
        debug("opds browse data received with feed links", putLinks, links.search);
        yield put(opdsActions.headerLinksUpdate.build(putLinks));

        if (links.search?.length) {

            const { b: getUrlAction } = yield* raceTyped({
                a: delay(20000),
                b: call(getUrlApi, links.search),
            });

            if (!getUrlAction) {
                debug("updateHeaderLinkWatcher timeout?", links.search);
                return;
            }

            yield call(setSearchLinkInHeader, getUrlAction);
        }
    }
}

function* getUrlApi(links: IOpdsLinkView[]) {

    yield apiSaga("opds/getUrlWithSearchLinks", SEARCH_OPDS_API_REQUEST_ID, links);
    while (true) {
        const action:
            apiActions.result.TAction<TReturnPromiseOrGeneratorType<TApiMethod["opds/getUrlWithSearchLinks"]>>
            = yield take(apiActions.result.ID);

        const { requestId } = action.meta.api;
        if (requestId === SEARCH_OPDS_API_REQUEST_ID) {
            return action;
        }
    }
}

function* setSearchLinkInHeader(action: apiActions.result.TAction<string>) {

    let searchRaw = action.payload;
    debug("opds search raw data received", searchRaw);

    let openSearchUrl: string | undefined;
    if (searchRaw.includes(OPDS_OPEN_SEARCH_DATA_SEPARATOR)) {
        const arr = searchRaw.split(OPDS_OPEN_SEARCH_DATA_SEPARATOR);
        openSearchUrl = arr[0];
        searchRaw = arr[1];
    }
    let returnUrl: string;
    try {
        if (openSearchUrl) {
            throw new Error("yep, we're jumping into the catch code block ...");
        }
        if (new URL(searchRaw)) {
            returnUrl = searchRaw;
        }
    } catch (_err) {
        try {
            searchRaw = removeUTF8BOM(searchRaw);
            // debug(Buffer.from(searchRaw).toString("hex"));

            const xmlDom = (new DOMParser()).parseFromString(searchRaw, ContentType.TextXml);
            // debug(xmlDom);
            // debug(new XMLSerializer().serializeToString(xmlDom));
            const urlsElem = xmlDom.documentElement.querySelectorAll("Url");
            // debug(urlsElem);

            for (const urlElem of urlsElem.values()) {
                const type = urlElem.getAttribute("type");
                debug(type);

                if (type && type.includes(ContentType.AtomXml)) {
                    const searchUrl = urlElem.getAttribute("template");
                    debug(searchUrl);

                    const url = new URL(searchUrl
                        .replace("{atom:author}", "")
                        .replace("{atom:contributor}", "")
                        .replace("{atom:title}", ""), openSearchUrl);
                    debug(url, url.search, url.pathname);

                    if (url.search.includes(SEARCH_TERM) ||
                        url.hash.includes(SEARCH_TERM) ||
                        tryDecodeURIComponent(url.pathname).includes(SEARCH_TERM)) {

                        returnUrl = url.toString();
                        debug(returnUrl);
                    }
                }
            }
        } catch (errXml) {
            debug("error to parse searchRaw (xml or url)", errXml);
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

// Credential challenges can also originate from a download or the catalog account button.
// Hand their response to the OPDS browser without issuing another authentication request.
let inlineAuthentication: { returnToPrevious: boolean; path: string } | undefined;

export function* presentAuthentication(action: authActions.present.TAction) {
    const { url, result } = action.payload;
    const location = yield* selectTyped((state: ILibraryRootState) => state.router.location);
    const current = parseOpdsBrowserRoute(location.pathname);
    inlineAuthentication = { returnToPrevious: current?.url !== url, path: location.pathname };
    if (current?.url === url) return;
    const path = buildOpdsBrowserRoute(current?.rootFeedIdentifier || "authentication",
        result.title || "", url, current ? current.level + 1 : 1);
    inlineAuthentication.path = path;
    handOffBrowseResponse(path, {
        url, responseUrl: url, statusCode: 401, isSuccess: false, isFailure: true,
        data: { opds: result },
    });
    yield put(push(path));
}

export function* authenticationDone() {
    const pending = inlineAuthentication;
    inlineAuthentication = undefined;
    const location = yield* selectTyped((state: ILibraryRootState) => state.router.location);
    if (pending?.path === location.pathname) {
        yield put(pending.returnToPrevious ? goBack() : historyActions.refresh.build());
    }
}

function authenticationCancelled() {
    inlineAuthentication = undefined;
}

export function saga() {
    return all([
        takeSpawnEvery(routerActions.locationChanged.ID, browseWatcher, (e) => debug(e)),
        takeSpawnEvery(authActions.present.ID, presentAuthentication, (e) => debug(e)),
        takeSpawnEvery(authActions.done.ID, authenticationDone, (e) => debug(e)),
        takeSpawnEvery(authActions.cancel.ID, authenticationCancelled, (e) => debug(e)),
    ]);
}
