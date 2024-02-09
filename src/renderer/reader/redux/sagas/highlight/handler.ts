// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import {
    takeSpawnEvery, takeSpawnEveryChannel,
} from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { all, call, put } from "redux-saga/effects";
import { select as selectTyped } from "typed-redux-saga/macro";

import { readerLocalActionHighlights, readerLocalActionLocatorHrefChanged } from "../../actions";
import {
    getHightlightClickChannel, mountHighlight, THighlightClick, unmountHightlight,
} from "./mounter";

/**
 * be careful when using it in parallel, there is a bug with action.payload (not duplicated).
 * You must used it by passing highlights array in the first parameter
 */
function* push(action: readerLocalActionHighlights.handler.push.TAction) {
    if (action.payload) {

        const href = yield* selectTyped((store: IReaderRootState) => store.reader?.locator?.locator?.href);

        // TODO: fix the bug with action.payload, need to copy object before to pass it to mountHighlight
        yield call(mountHighlight, href, action.payload);
    }
}

/**
 * be careful when using it in parallel, there is a bug with action.payload (not duplicated).
 * You must used it by passing highlights array in the first parameter
 */
function* pop(action: readerLocalActionHighlights.handler.pop.TAction) {
    if (action.payload) {

        const href = yield* selectTyped((store: IReaderRootState) => store.reader?.locator?.locator?.href);
        // TODO: same here
        yield call(unmountHightlight, href, action.payload);
    }
}

function* hrefChanged(action: readerLocalActionLocatorHrefChanged.TAction) {

    const { payload: { href, prevHref } } = action;

    const mounterState = yield* selectTyped((state: IReaderRootState) => state.reader.highlight.mounter);
    const mounterUuid = mounterState.map(([uuid]) => ({ uuid }));
    yield call(unmountHightlight, href, mounterUuid);
    if (prevHref) {
        yield call(unmountHightlight, prevHref, mounterUuid);
    }

    const handlerState = yield* selectTyped((state: IReaderRootState) => state.reader.highlight.handler);
    const handler = handlerState.map(([, state]) => state);
    yield call(mountHighlight, href, handler);
    if (prevHref) {
        yield call(mountHighlight, prevHref, handler);
    }
}

function* dispatchClick(data: THighlightClick) {

    const [, ref] = data;

    const highlightMounterMap = yield* selectTyped((state: IReaderRootState) => state.reader.highlight.mounter);
    const highlightFound = highlightMounterMap.find(([, v]) => v.id === ref.id);
    const [uuid] = highlightFound;

    const highlightHandlerMap = yield* selectTyped((state: IReaderRootState) => state.reader.highlight.handler);
    const handlerFound = highlightHandlerMap.find(([v]) => v === uuid);
    const [, handlerState] = handlerFound;

    yield put(readerLocalActionHighlights.click.build(handlerState));
}

export const saga = () => {

    const clickChannel = getHightlightClickChannel();
    return all([
        takeSpawnEvery(
            readerLocalActionHighlights.handler.pop.ID,
            pop,
        ),
        takeSpawnEvery(
            readerLocalActionHighlights.handler.push.ID,
            push,
        ),
        takeSpawnEvery(
            readerLocalActionLocatorHrefChanged.ID,
            hrefChanged,
        ),
        takeSpawnEveryChannel(
            clickChannel,
            dispatchClick,
        ),
    ]);
};
