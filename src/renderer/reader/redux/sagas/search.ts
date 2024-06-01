// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";

import { clone, flatten } from "ramda";
import { takeSpawnEvery } from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { ContentType } from "readium-desktop/utils/contentType";
import { search } from "readium-desktop/utils/search/search";
import { ISearchDocument, ISearchResult } from "readium-desktop/utils/search/search.interface";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { all, call, cancel, join, put, take } from "redux-saga/effects";
import {
    all as allTyped, delay as delayTyped, fork as forkTyped, select as selectTyped, takeEvery as takeEveryTyped,
    takeLatest as takeLatestTyped,
} from "typed-redux-saga/macro";

import { IRangeInfo } from "@r2-navigator-js/electron/common/selection";
import { handleLinkLocator } from "@r2-navigator-js/electron/renderer";
import { Locator as R2Locator } from "@r2-navigator-js/electron/common/locator";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";
import { Link } from "@r2-shared-js/models/publication-link";

import { readerLocalActionHighlights, readerLocalActionSearch } from "../actions";
import { IHighlightHandlerState } from "readium-desktop/common/redux/states/renderer/highlight";

import debounce from "debounce";

const handleLinkLocatorDebounced = debounce(handleLinkLocator, 200);

const debug = debug_("readium-desktop:renderer:reader:redux:sagas:search");

const COLOR_SEARCH = {
    red: 190,
    green: 233,
    blue: 34,
};
const COLOR_SEARCH_FOCUS = {
    red: 241,
    green: 79,
    blue: 237,
};

function createLocatorLink(href: string, rangeInfo: IRangeInfo): R2Locator {

    return {
        href,
        locations: {
            cssSelector: rangeInfo.startContainerElementCssSelector,
            rangeInfo,
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

function converterSearchResultToHighlightHandlerState(v: ISearchResult, color = COLOR_SEARCH): IHighlightHandlerState {
    return {
        uuid: v.uuid,
        href: v.href,
        def: {
            group: "search",
            color,
            selectionInfo: {
                cleanBefore: v.cleanBefore,
                cleanText: v.cleanText,
                cleanAfter: v.cleanAfter,
                // rawBefore: v.rawBefore,
                // rawText: v.rawText,
                // rawAfter: v.rawAfter,
                rawBefore: "",
                rawText: "",
                rawAfter: "",
                rangeInfo: v.rangeInfo,
            },
        },
    };
}

function* searchFound(action: readerLocalActionSearch.found.TAction) {
    const { foundArray } = action.payload;
    debug(`searchFound (push highlights) -- foundArray: [${foundArray ? foundArray.length : JSON.stringify(foundArray, null, 4)}]`);

    if (foundArray?.length) {
        const highlightHandlerState = foundArray.map(
            (v) => converterSearchResultToHighlightHandlerState(v),
        );
        yield put(readerLocalActionHighlights.handler.push.build(highlightHandlerState));

        // auto focus diable
        // yield put(readerLocalActionSearch.focus.build(highlightHandlerState[0].uuid));
    }
}

function* searchFocus(action: readerLocalActionSearch.focus.TAction) {

    const { newFocusUUId, oldFocusUUId } = action.payload;
    debug(`searchFocus -- oldFocusUUId: [${oldFocusUUId}] newFocusUUId: [${newFocusUUId}]`);

    const { foundArray } = yield* selectTyped((state: IReaderRootState) => state.search);

    const oldItem = foundArray.find((v) => v.uuid === oldFocusUUId);
    const newItem = foundArray.find((v) => v.uuid === newFocusUUId);


    // page turn, same current search focus but position / scroll needs to be restored!
    if (newItem && newFocusUUId === oldFocusUUId) {
        handleLinkLocatorDebounced(createLocatorLink(newItem.href, newItem.rangeInfo));
        return;
    }

    if (newItem && oldItem) {
        const oldItemClone = clone(oldItem);
        const newItemClone = clone(newItem);

        debug(`searchFocus (pop highlights) -- oldFocusUUId: [${oldFocusUUId}] newFocusUUId: [${newFocusUUId}]`);

        yield put(readerLocalActionHighlights.handler.pop.build([
            { uuid: oldFocusUUId },
            { uuid: newFocusUUId },
        ]),
        );

        debug(`searchFocus (push highlights) -- oldFocusUUId: [${oldFocusUUId}] newFocusUUId: [${newFocusUUId}]`);

        yield put(
            readerLocalActionHighlights.handler.push.build([
                converterSearchResultToHighlightHandlerState(oldItemClone),
                converterSearchResultToHighlightHandlerState(newItemClone, COLOR_SEARCH_FOCUS),
            ]),
        );

        handleLinkLocatorDebounced(createLocatorLink(newItem.href, newItem.rangeInfo));

    } else if (newItem) {
        const newItemClone = clone(newItem);

        debug(`searchFocus (pop highlights) -- newFocusUUId: [${newFocusUUId}]`);

        yield put(readerLocalActionHighlights.handler.pop.build([
            { uuid: newFocusUUId },
        ]));

        debug(`searchFocus (push highlights) -- newFocusUUId: [${newFocusUUId}]`);

        yield put(
            readerLocalActionHighlights.handler.push.build([
                converterSearchResultToHighlightHandlerState(newItemClone, COLOR_SEARCH_FOCUS),
            ]),
        );

        handleLinkLocatorDebounced(createLocatorLink(newItem.href, newItem.rangeInfo));
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
        debug(`requestPublicationData ISearchDocument: [${JSON.stringify(ret, null, 4)}]`);

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
            console.error("requestPublicationData", ln.Href, e);
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

            yield* delayTyped(100); // refresh load props in Search.tsx (Caused by React18 !?, the load spinner doesn't rotate now !)

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

    const { uuid, def: {group} } = action.payload;

    if (uuid && group === "search") {
        debug(`highlightClick ACTION (will focus) -- handlerState: [${JSON.stringify(action.payload, null, 4)}]`);
        yield put(readerLocalActionSearch.focus.build(uuid));
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
        debug(`searchFocusPreviousOrNext (will focus) -- item: [${JSON.stringify(item, null, 4)}]`);
        yield put(readerLocalActionSearch.focus.build(item.uuid));
    } else {
        debug(`searchFocusPreviousOrNext (will focus) -- foundArray[0]: [${JSON.stringify(foundArray[0], null, 4)}]`);
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

    const handlerStateMap = yield* selectTyped((state: IReaderRootState) => state.reader.highlight.handler);
    if (!handlerStateMap?.length) {
        debug(`clearSearch HANDLER STATE EMPTY -- handlerStateMap: [${JSON.stringify(handlerStateMap, null, 4)}]`);
        return;
    }

    const uuids = handlerStateMap
        .filter(([_uuid, handlerState]) => handlerState.def.group === "search")
        .map(([uuid, _handlerState]) => ({ uuid }));

    debug(`clearSearch (highlight pop) -- uuids: [${JSON.stringify(uuids, null, 4)}]`);

    // yield* callTyped(() => highlightsRemoveAll(href, ["search"])); // "annotation"
    yield put(readerLocalActionHighlights.handler.pop.build(uuids));
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
