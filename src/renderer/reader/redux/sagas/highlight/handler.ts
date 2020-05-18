// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { takeSpawnEvery } from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { selectTyped } from "readium-desktop/common/redux/sagas/typed-saga";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { all, call } from "redux-saga/effects";

import { readerLocalActionHighlights, readerLocalActionSetLocator } from "../../actions";
import { mountHighlight, unmountHightlight } from "./mounter";

function* mountHighlightsWatcher(action: readerLocalActionSetLocator.TAction) {
    const href = yield* selectTyped((store: IReaderRootState) => store.reader?.locator?.locator?.href);
    const newHref = action.payload?.locator?.href;

    if (href !== newHref) {
        const handlerStateMap = yield* selectTyped((store: IReaderRootState) => store.reader.highlight.handler);
        const handlerState = handlerStateMap.map(([, state]) => state);
        yield call(mountHighlight, newHref, handlerState);
    }
}

function* push(action: readerLocalActionHighlights.handler.push.TAction) {
    if (action.payload) {

        const href = yield* selectTyped((store: IReaderRootState) => store.reader?.locator?.locator?.href);
        yield call(mountHighlight, href, action.payload);
    }
}

function* pop(action: readerLocalActionHighlights.handler.pop.TAction) {
    if (action.payload) {

        const href = yield* selectTyped((store: IReaderRootState) => store.reader?.locator?.locator?.href);
        yield call(unmountHightlight, href, action.payload);
    }
}

export const saga = () =>
all([
    takeSpawnEvery(
        readerLocalActionSetLocator.ID,
        mountHighlightsWatcher,
    ),
    takeSpawnEvery(
        readerLocalActionHighlights.handler.pop.ID,
        pop,
    ),
    takeSpawnEvery(
        readerLocalActionHighlights.handler.push.ID,
        push,
    ),
]);
