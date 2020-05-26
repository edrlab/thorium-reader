// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { clone, flatten } from "ramda";
import { takeSpawnEvery } from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { selectTyped } from "readium-desktop/common/redux/sagas/typed-saga";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { search } from "readium-desktop/utils/search/search";
import { ISearchDocument, ISearchResult } from "readium-desktop/utils/search/search.interface";
import {
    all, call, cancel, fork, join, put, take, takeEvery, takeLatest,
} from "redux-saga/effects";

import { readerLocalActionHighlights, readerLocalActionSearch } from "../actions";
import { IHighlightHandlerState } from "../state/highlight";

// DEMO
// const searchFct = async (..._arg: any) =>
//     new Promise<ISearchResult[]>((resolve) => setTimeout(() => resolve([]), 1000));

const searchFct = search;

function* searchRequest(action: readerLocalActionSearch.request.TAction) {

    const text = action.payload.textSearch;
    const cacheFromState = yield* selectTyped((state: IReaderRootState) => state.search.cacheArray);

    const searchMap = cacheFromState.map(
        (v) =>
            call(async () => {
                return await searchFct(text, v);
            }),
    );

    const res = yield all(searchMap);

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

    yield put(readerLocalActionHighlights.handler.push.build(...highlightHandlerState));
}

function* searchFocus(action: readerLocalActionSearch.focus.TAction) {
    const { focusUUId: newUUid } = action.payload;

    const { focusUUId: oldUUid, foundArray } = yield* selectTyped((state: IReaderRootState) => state.search);

    const oldItem = foundArray.find((v) => v.uuid === oldUUid);
    const newItem = foundArray.find((v) => v.uuid === newUUid);

    if (oldItem && newItem) {
        const oldItemClone = clone(oldItem);
        const newItemClone = clone(newItem);

        yield put(readerLocalActionHighlights.handler.pop.build(
            { uuid: oldUUid },
            { uuid: newUUid }),
        );

        yield put(
            readerLocalActionHighlights.handler.push.build(
                converterSearchResultToHighlightHandlerState(oldItemClone, {
                    red: 255,
                    green: 0,
                    blue: 0,
                }),
                converterSearchResultToHighlightHandlerState(newItemClone, {
                    red: 255,
                    green: 0,
                    blue: 0,
                }),
            ),
        );
    }
}

function* requestPublicationData() {

    const r2Manifest = yield* selectTyped((state: IReaderRootState) => state.reader.info.r2Publication);
    const manifestUrlR2Protocol = yield* selectTyped(
        (state: IReaderRootState) => state.reader.info.manifestUrlR2Protocol,
    );
    const request = r2Manifest.Spine.map((ln) => call(async () => {
        let ret: ISearchDocument;
        try {
            const url = new URL(ln.Href, manifestUrlR2Protocol);
            const urlStr = url.toString();
            const res = await fetch(urlStr);
            if (res.ok) {
                const text = await res.text();
                ret = { href: ln.Href, xml: text };
            }
        } catch (e) {
            console.error("request", ln.Href, e);
        }

        return ret;
    }));

    const result = yield all(request);
    yield put(readerLocalActionSearch.setCache.build(...result));
}

function* searchEnable(_action: readerLocalActionSearch.enable.TAction) {

    const taskRequest = yield fork(requestPublicationData);

    const taskSearch = yield takeLatest(readerLocalActionSearch.request.build,
        function*(action: readerLocalActionSearch.request.TAction) {
            yield join(taskRequest);

            yield call(searchRequest, action);
        },
    );

    const taskFound = yield takeEvery(readerLocalActionSearch.found.build, searchFound);

    const taskFocus = yield takeEvery(readerLocalActionSearch.focus.build, searchFocus);

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
    const { focusUUId, foundArray } = yield* selectTyped((state: IReaderRootState) => state.search);

    const index = foundArray.findIndex((v) => v.uuid === focusUUId);
    if (index > -1 && foundArray[index + offset]) {

        const item = foundArray[index + offset];
        yield put(readerLocalActionSearch.focus.build(item.uuid));
    }
}

function searchPrevious() {
    return searchFocusPreviousOrNext(-1);
}

function searchNext() {
    return searchFocusPreviousOrNext(+1);
}

function* searchCancel() {

    const handlerState = yield* selectTyped((state: IReaderRootState) => state.reader.highlight.handler);
    const uuidArray = handlerState
        .filter(([, v]) => v.type === "search")
        .map(([id]) => ({ uuid: id }));

    yield put(readerLocalActionHighlights.handler.pop.build(...uuidArray));
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
