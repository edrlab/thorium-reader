// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { winActions } from "readium-desktop/renderer/common/redux/actions";
import * as publicationInfoReaderAndLib from "readium-desktop/renderer/common/redux/sagas/dialog/publicationInfoReaderAndLib";
import * as publicationInfoSyncTag from "readium-desktop/renderer/common/redux/sagas/dialog/publicationInfosSyncTags";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { all, call, take } from "redux-saga/effects";

import * as readerConfig from "./readerConfig";
import * as highlightHandler from "./highlight/handler";
import * as i18n from "./i18n";
import * as ipc from "./ipc";
import * as search from "./search";
import * as winInit from "./win";
import * as noteSaga from "./note";
import * as shareAnnotationSet from "./readiumAnnotation/shareAnnotationSet";
import * as img from "./img";
import * as settingsOrMenuDialogOrDock from "./settingsOrMenu";
import { takeSpawnEvery, takeSpawnEveryChannel } from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { setTheme } from "readium-desktop/common/redux/actions/theme";
import { MediaOverlaysStateEnum, TTSStateEnum, mediaOverlaysListen, ttsListen } from "@r2-navigator-js/electron/renderer";
import { eventChannel } from "redux-saga";
import { put as putTyped, take as takeTyped, select as selectTyped, call as callTyped, delay as delayTyped } from "typed-redux-saga/macro";
import { readerLocalActionReader } from "../actions";
import { readerActions } from "readium-desktop/common/redux/actions";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { spawnLeading } from "readium-desktop/common/redux/sagas/spawnLeading";

// Logger
const filename_ = "readium-desktop:renderer:reader:saga:index";
const debug = debug_(filename_);
debug("_");

export function getMediaOverlayStateChannel() {
    const channel = eventChannel<MediaOverlaysStateEnum>(
        (emit) => {

            const handler = (state: MediaOverlaysStateEnum) => {
                emit(state);
            };

            mediaOverlaysListen(handler);

            // eslint-disable-next-line @typescript-eslint/no-empty-function
            return () => {
                // no destrutor
            };
        },
    );

    return channel;
}

export function getTTSStateChannel() {
    const channel = eventChannel<TTSStateEnum>(
        (emit) => {

            const handler = (state: TTSStateEnum) => {
                emit(state);
            };

            ttsListen(handler);

            // eslint-disable-next-line @typescript-eslint/no-empty-function
            return () => {
                // no destrutor
            };
        },
    );

    return channel;
}


export function* rootSaga() {

    yield take(winActions.initRequest.ID);

    yield call(winInit.render);

    yield all([
        i18n.saga(),
        ipc.saga(),

        publicationInfoReaderAndLib.saga(),
        publicationInfoSyncTag.saga(),

        readerConfig.saga(),

        highlightHandler.saga(),

        search.saga(),

        noteSaga.saga(),
        
        shareAnnotationSet.saga(),

        img.saga(),

        settingsOrMenuDialogOrDock.saga(),

        takeSpawnEvery(
            setTheme.ID,
            (action: setTheme.TAction) => {
                const { payload: { name } } = action;
                document.body.setAttribute("data-theme", name);
            },
        ),
    ]);

    debug("SAGA-rootSaga() PRE INIT SUCCESS");

    const MOChannel = getMediaOverlayStateChannel();
    const TTSChannel = getTTSStateChannel();
    yield all([
        takeSpawnEveryChannel(
            MOChannel,
            function* (state: MediaOverlaysStateEnum) {
                yield* putTyped(readerLocalActionReader.setMediaOverlayState.build(state));
            },
        ),
        takeSpawnEveryChannel(
            TTSChannel,
            function* (state: TTSStateEnum) {
                yield* putTyped(readerLocalActionReader.setTTSState.build(state));
            },
        ),
        spawnLeading(function*() {

            let gotTheLock = yield* selectTyped((state: IReaderRootState) => state.reader.lock);
            if (!gotTheLock) {
                yield* takeTyped(readerActions.setTheLock.build);
            }

            gotTheLock = yield* selectTyped((state: IReaderRootState) => state.reader.lock);
            if (!gotTheLock) {
                throw new Error("unreachable!!!");
            }

            yield* delayTyped(1000); // wait for the reader start stabilisation (aka highlight mounting)

            const notes = yield* selectTyped((state: IReaderRootState) => state.reader.note);
            for (const note of notes) {

                yield* delayTyped(10); // 100 notes equals to 1 + 1 seconds , seems acceptable to not disturb user with a tiny compute machine
                yield* callTyped(noteSaga.noteUpdateSelector, note);
            }
        }),
    ]);


    debug("SAGA-rootSaga() INIT SUCCESS");

    // initSuccess triggered in reader.tsx didmount and publication loaded
    // yield put(winActions.initSuccess.build());

}
