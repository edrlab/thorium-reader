// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { zipWith } from "ramda";
import { callTyped, selectTyped } from "readium-desktop/common/redux/sagas/typed-saga";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { SagaIterator } from "redux-saga";
import { put } from "redux-saga/effects";

import { highlightsCreate, highlightsRemove } from "@r2-navigator-js/electron/renderer";

import { readerLocalActionHighlights } from "../../actions";
import {
    IHighlightBaseState, IHighlightHandlerState, IHighlightMounterState,
} from "../../state/highlight";

export function* mountHighlight(href: string, handlerState: IHighlightHandlerState[]): SagaIterator {

    // check if the highlight is not yet mounted
    const highlightMounterArray = yield* selectTyped((state: IReaderRootState) => state.reader.highlight.mounter);
    const filteredMountedArray = handlerState.filter(
        ({ uuid }) =>
            highlightMounterArray.findIndex(([uuidFind]) => uuid !== uuidFind) >= 0,
    );

    const filterHrefArray = filteredMountedArray
    .filter((v) => v?.href === href);

    const defArray = filterHrefArray.map((v) => v.def);
    const uuidArray = filterHrefArray.map((v) => v.uuid);

    const mounted = yield* callTyped(highlightsCreate, href, defArray);
    const mountedArray = zipWith(
        (uuid, ref) => ({
            uuid,
            ref,
        } as IHighlightMounterState),
        uuidArray,
        mounted,
    )
        .filter((v) => v.ref);

    yield put(readerLocalActionHighlights.mounter.mount.build(...mountedArray));
}

export function* unmountHightlight(href: string, baseState: IHighlightBaseState[]): SagaIterator {

    // get highlight ids filtered on href and state uuid list
    const highlightHandlerArray = yield* selectTyped((state: IReaderRootState) => state.reader.highlight.handler);
    const highlightHandlerFiltered = highlightHandlerArray.filter(
        ([uuid, handlerState]) =>
            baseState.findIndex(({uuid: uuidFind}) => uuid === uuidFind) >= 0 && href === handlerState.href);

    const highlightMounterArray = yield* selectTyped((state: IReaderRootState) => state.reader.highlight.mounter);
    const filteredArray = highlightMounterArray.filter(
        ([uuid]) =>
            highlightHandlerFiltered.findIndex(([uuidFind]) => uuid === uuidFind) >= 0,
    )
        .map(([, ref]) => ref.id);

    // remove hightlight mounted on the href webview
    yield* callTyped(highlightsRemove, href, filteredArray);

    // pull all hightlight from state (pop)
    // navigator-js doesn't keep hightlight state beetween webview access
    yield put(readerLocalActionHighlights.mounter.unmount.build(...baseState));

}
