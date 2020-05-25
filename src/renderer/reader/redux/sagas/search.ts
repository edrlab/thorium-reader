// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { clone } from "ramda";
import { takeSpawnEvery } from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { callTyped, selectTyped } from "readium-desktop/common/redux/sagas/typed-saga";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { all, cancel, fork, put, take, takeEvery, takeLatest } from "redux-saga/effects";

import { readerLocalActionHighlights, readerLocalActionSearch } from "../actions";
import { IHighlightHandlerState } from "../state/highlight";
import { ICacheXml, ISearchResult } from "../state/search";

// DEMO
const searchFct = (..._arg: any) => [] as ISearchResult[];

function searchIterationFork(text: string, cacheArray: ICacheXml[]) {

    const searchFork = cacheArray.map(
        (v) =>
            fork(function*() {
                const res = yield* callTyped(() => searchFct(text, v.xml, v.href));
                yield put(readerLocalActionSearch.found.build(res));
            }),
    );
    return all(searchFork);
}

function* setCache(text: string, action: readerLocalActionSearch.setCache.TAction) {

    yield searchIterationFork(text, action.payload.cacheArray);
}

function* searchRequest(action: readerLocalActionSearch.request.TAction) {

    const text = action.payload.textSearch;
    const cacheFromState = yield* selectTyped((state: IReaderRootState) => state.search.cacheArray);

    // do search from cache array
    yield searchIterationFork(text, cacheFromState);

    // on any another setCache throw search in it
    yield takeEvery(readerLocalActionSearch.setCache.ID, setCache, text);
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
                rangeInfo: v.rangeInfos,
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

function* searchEnable(_action: readerLocalActionSearch.enable.TAction) {

    const r2Manifest = yield* selectTyped((state: IReaderRootState) => state.reader.info.r2Publication);
    const manifestUrlR2Protocol = yield* selectTyped(
        (state: IReaderRootState) => state.reader.info.manifestUrlR2Protocol,
    );

    const requestFork = r2Manifest.Spine.map((ln) => fork(function*() {
        try {
            const url = new URL(ln.Href, manifestUrlR2Protocol);
            const urlStr = url.toString();
            const res = yield* callTyped(() => fetch(urlStr));
            if (res.ok) {
                const text = yield* callTyped(() => res.text());
                yield put(readerLocalActionSearch.setCache.build(text, ln.Href));
            }
        } catch (e) {
            console.error("request", ln.Href, e);
        }
    }));

    const taskRequest = yield all(requestFork);

    const taskSearch = yield takeLatest(readerLocalActionSearch.request.build, searchRequest);

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

    const { foundArray } = yield* selectTyped((state: IReaderRootState) => state.search);

    const uuidArray = foundArray.map((v) => ({uuid: v.uuid}));

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
