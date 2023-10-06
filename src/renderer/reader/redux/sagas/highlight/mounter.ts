// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { zipWith } from "ramda";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { eventChannel, SagaIterator } from "redux-saga";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { put } from "redux-saga/effects";
import { call as callTyped, select as selectTyped } from "typed-redux-saga/macro";

import { IHighlight } from "@r2-navigator-js/electron/common/highlight";
import {
    highlightsClickListen, highlightsCreate, highlightsRemove,
} from "@r2-navigator-js/electron/renderer";

import { readerLocalActionHighlights } from "../../actions";
import {
    IHighlightBaseState, IHighlightHandlerState, IHighlightMounterState,
} from "readium-desktop/common/redux/states/renderer/highlight";

export function* mountHighlight(href: string, handlerState: IHighlightHandlerState[]): SagaIterator {

    // check if the highlight uuid is not yet mounted
    const highlightMounterArray = yield* selectTyped((state: IReaderRootState) => state.reader.highlight.mounter);
    const filteredMountedArray = handlerState.filter(
        ({ uuid, href: hrefHandlerState }) =>
            highlightMounterArray.findIndex(([uuidFind]) => uuid === uuidFind) < 0 // true if not present in mounter
            && hrefHandlerState === href,
    );

    const defArray = filteredMountedArray.map((v) => v.def);
    const uuidArray = filteredMountedArray.map((v) => v.uuid);

    const mountedArray = yield* callTyped(highlightsCreate, href, defArray);

    const handlerMounted = zipWith(
        (uuid, ref) => ({
            uuid,
            ref,
        } as IHighlightMounterState),
        uuidArray,
        mountedArray,
    );
    const filteredHandlerMounted = handlerMounted.filter((v) => v.ref);

    yield put(readerLocalActionHighlights.mounter.mount.build(...filteredHandlerMounted));
}

export function* unmountHightlight(href: string, baseState: IHighlightBaseState[]): SagaIterator {

    // filter handler filtered with mounter uuid and map mounted highlight id
    const highlightMounterArray = yield* selectTyped((state: IReaderRootState) => state.reader.highlight.mounter);
    const filteredArray = highlightMounterArray
        .filter(
            ([uuid]) =>
                baseState.findIndex(({ uuid: uuidFind }) => uuid === uuidFind) >= 0,
        )
        .map(([, ref]) => ref.id);

    // remove hightlight mounted on the href webview
    yield* callTyped(() => highlightsRemove(href, filteredArray));

    // pull all hightlight from state (pop)
    // navigator-js doesn't keep hightlight state beetween webview access
    yield put(readerLocalActionHighlights.mounter.unmount.build(...baseState));
}

export type THighlightClick = [string, IHighlight];

export function getHightlightClickChannel() {
    const channel = eventChannel<THighlightClick>(
        (emit) => {

            const handler = (href: string, highlight: IHighlight) => {
                emit([href, highlight]);
            };

            highlightsClickListen(handler);

            // eslint-disable-next-line @typescript-eslint/no-empty-function
            return () => {
                // no destrutor
            };
        },
    );

    return channel;
}
