// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { clone, flatten } from "ramda";
import { takeSpawnEvery } from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { ContentType } from "readium-desktop/utils/contentType";
import { search } from "readium-desktop/utils/search/search";
import { ISearchDocument, ISearchResult } from "readium-desktop/utils/search/search.interface";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { all, call, cancel, join, put, take } from "redux-saga/effects";
import {
    all as allTyped, fork as forkTyped, select as selectTyped, takeEvery as takeEveryTyped,
    takeLatest as takeLatestTyped,
} from "typed-redux-saga/macro";

import { IRangeInfo } from "@r2-navigator-js/electron/common/selection";
import { handleLinkLocator } from "@r2-navigator-js/electron/renderer";
import { Locator as R2Locator } from "@r2-shared-js/models/locator";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";
import { Link } from "@r2-shared-js/models/publication-link";

import { readerLocalActionHighlights, readerLocalActionSearch } from "../actions";
import { IHighlightHandlerState } from "../state/highlight";

function createLocatorLink(href: string, rangeInfo: IRangeInfo): R2Locator {

    return {
        href,
        locations: {
            cssSelector: rangeInfo.startContainerElementCssSelector,
        },
    };
}

// DEMO
// const searchFct = async (..._arg: any) =>
//     new Promise<ISearchResult[]>((resolve) => setTimeout(() => resolve([]), 1000));

const searchFct = search;

function* searchRequest(action: readerLocalActionSearch.request.TAction) {

    yield call(clearSearch);

    const text = action.payload.textSearch;
    const cacheFromState = yield* selectTyped((state: IReaderRootState) => state.search.cacheArray);

    const searchMap = cacheFromState.map(
        (v) =>
            call(async () => {
                return await searchFct(text, v);
            }),
    );

    const res = yield* allTyped(searchMap);

    yield put(readerLocalActionSearch.found.build(flatten(res)));
}

function converterSearchResultToHighlightHandlerState(v: ISearchResult, color = {
    red: 0,
    green: 255,
    blue: 0,
}): IHighlightHandlerState {
    return {
        uuid: v.uuid,
        href: v.href,
        type: "search",
        def: {
            color,
            selectionInfo: {
                cleanText: "",
                rawText: v.textMatch,
                rangeInfo: v.rangeInfo,
            },
        },
    };
}

function* searchFound(action: readerLocalActionSearch.found.TAction) {
    const { foundArray } = action.payload;

    const highlightHandlerState = foundArray.map(
        (v) => converterSearchResultToHighlightHandlerState(v),
    );

    if (highlightHandlerState[0]) {

        yield put(readerLocalActionHighlights.handler.push.build(...highlightHandlerState));

        // auto focus diable
        // yield put(readerLocalActionSearch.focus.build(highlightHandlerState[0].uuid));
    }
}

function* searchFocus(action: readerLocalActionSearch.focus.TAction) {

    const { newFocusUUId, oldFocusUUId } = action.payload;
    if (newFocusUUId !== oldFocusUUId) {

        const { foundArray } = yield* selectTyped((state: IReaderRootState) => state.search);

        const oldItem = foundArray.find((v) => v.uuid === oldFocusUUId);
        const newItem = foundArray.find((v) => v.uuid === newFocusUUId);

        if (newItem && oldItem) {
            const oldItemClone = clone(oldItem);
            const newItemClone = clone(newItem);

            yield put(readerLocalActionHighlights.handler.pop.build(
                { uuid: oldFocusUUId },
                { uuid: newFocusUUId }),
            );

            yield put(
                readerLocalActionHighlights.handler.push.build(
                    converterSearchResultToHighlightHandlerState(oldItemClone),
                    converterSearchResultToHighlightHandlerState(newItemClone, {
                        red: 255,
                        green: 0,
                        blue: 0,
                    }),
                ),
            );

            handleLinkLocator(createLocatorLink(newItem.href, newItem.rangeInfo));

        } else if (newItem) {
            const newItemClone = clone(newItem);

            yield put(readerLocalActionHighlights.handler.pop.build(
                { uuid: newFocusUUId }),
            );

            yield put(
                readerLocalActionHighlights.handler.push.build(
                    converterSearchResultToHighlightHandlerState(newItemClone, {
                        red: 255,
                        green: 0,
                        blue: 0,
                    }),
                ),
            );

            handleLinkLocator(createLocatorLink(newItem.href, newItem.rangeInfo));
        }
    }
}

const isFixedLayout = (link: Link, publication: R2Publication): boolean => {
    if (link && link.Properties) {
        if (link.Properties.Layout === "fixed") {
            return true;
        }
        if (typeof link.Properties.Layout !== "undefined") {
            return false;
        }
    }

    if (publication &&
        publication.Metadata &&
        publication.Metadata.Rendition) {
        return publication.Metadata.Rendition.Layout === "fixed";
    }
    return false;
};

function* requestPublicationData() {

    const r2Manifest = yield* selectTyped((state: IReaderRootState) => state.reader.info.r2Publication);
    const manifestUrlR2Protocol = yield* selectTyped(
        (state: IReaderRootState) => state.reader.info.manifestUrlR2Protocol,
    );
    const request = r2Manifest.Spine.map((ln) => call(async () => {
        const ret: ISearchDocument = {
            xml: "", // initialized in code below
            href: ln.Href,
            contentType: ln.TypeLink ? ln.TypeLink : ContentType.Xhtml,
            isFixedLayout: isFixedLayout(ln, r2Manifest),
        };
        try {
            // DEPRECATED API (watch for the inverse function parameter order!):
            // url.resolve(manifestUrlR2Protocol, ln.Href)
            const url = new URL(ln.Href, manifestUrlR2Protocol);
            if (url.pathname.endsWith(".html") || url.pathname.endsWith(".xhtml") || url.pathname.endsWith(".xml")
                || ln.TypeLink === ContentType.Xhtml
                || ln.TypeLink === ContentType.Html
                || ln.TypeLink === ContentType.Xml) {

                const urlStr = url.toString();
                const res = await fetch(urlStr);
                if (res.ok) {
                    const text = await res.text();
                    ret.xml = text;
                }
            }
        } catch (e) {
            console.error("request", ln.Href, e);
        }

        return ret;
    }));

    const result = yield* allTyped(request);
    yield put(readerLocalActionSearch.setCache.build(...result));
}

function* searchEnable(_action: readerLocalActionSearch.enable.TAction) {

    const taskRequest = yield* forkTyped(requestPublicationData);

    const taskSearch = yield* takeLatestTyped(readerLocalActionSearch.request.build,
        function*(action: readerLocalActionSearch.request.TAction) {
            yield join(taskRequest);

            yield call(searchRequest, action);
        },
    );

    const taskFound = yield* takeEveryTyped(readerLocalActionSearch.found.build, searchFound);

    const taskFocus = yield* takeEveryTyped(readerLocalActionSearch.focus.build, searchFocus);

    // wait the search cancellation
    yield take(readerLocalActionSearch.cancel.ID);

    yield cancel(taskRequest);
    yield cancel(taskSearch);
    yield cancel(taskFocus);
    yield cancel(taskFound);
}

function* highlightClick(action: readerLocalActionHighlights.click.TAction) {

    const { type, uuid } = action.payload;

    if (type === "search") {
        if (uuid) {
            yield put(readerLocalActionSearch.focus.build(uuid));
        }
    }
}

function* searchFocusPreviousOrNext(offset: number) {
    const { newFocusUUId, foundArray } = yield* selectTyped((state: IReaderRootState) => state.search);

    const index = foundArray.findIndex((v) => v.uuid === newFocusUUId);
    if (index > -1) {
        let item: ISearchResult;
        if (foundArray[index + offset]) {
            item = foundArray[index + offset];
        } else if ((index + offset) < 0) {
            item = foundArray[foundArray.length - 1];
        } else {
            item = foundArray[0];
        }
        yield put(readerLocalActionSearch.focus.build(item.uuid));
    } else {
        yield put(readerLocalActionSearch.focus.build(foundArray[0]?.uuid || ""));
    }
}

function searchPrevious() {
    return searchFocusPreviousOrNext(-1);
}

function searchNext() {
    return searchFocusPreviousOrNext(+1);
}

// TODO could be moved in highlight handler saga with an action
function* clearSearch() {
    const handlerState = yield* selectTyped((state: IReaderRootState) => state.reader.highlight.handler);
    const uuidArray = handlerState
        .filter(([, v]) => v.type === "search")
        .map(([id]) => ({ uuid: id }));

    yield put(readerLocalActionHighlights.handler.pop.build(...uuidArray));
}

function* searchCancel() {
    yield call(clearSearch);
}

export const saga = () => {
    return all([
        takeSpawnEvery(
            readerLocalActionSearch.enable.ID,
            searchEnable,
            (e) => console.error(e),
        ),
        takeSpawnEvery(
            readerLocalActionSearch.cancel.ID,
            searchCancel,
            (e) => console.error(e),
        ),
        // takeSpawnLatest(
        //     readerLocalActionSearch.request.ID,
        //     searchProcess,
        //     (e) => console.error(e),
        // ),
        takeSpawnEvery(
            readerLocalActionHighlights.click.ID,
            highlightClick,
            (e) => console.error(e),
        ),
        takeSpawnEvery(
            readerLocalActionSearch.next.ID,
            searchNext,
            (e) => console.error(e),
        ),
        takeSpawnEvery(
            readerLocalActionSearch.previous.ID,
            searchPrevious,
            (e) => console.error(e),
        ),
    ]);
};
