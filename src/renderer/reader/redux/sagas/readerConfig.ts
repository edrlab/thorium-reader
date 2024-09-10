// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { computeReadiumCssJsonMessage } from "readium-desktop/common/computeReadiumCssJsonMessage";
import { takeSpawnEvery } from "readium-desktop/common/redux/sagas/takeSpawnEvery";

import { MediaOverlaysStateEnum, TTSStateEnum, mediaOverlaysEnableCaptionsMode, mediaOverlaysEnableSkippability,
    mediaOverlaysPause, mediaOverlaysResume, readiumCssUpdate, reloadContent, ttsOverlayEnable, ttsPlay,
    ttsSentenceDetectionEnable, ttsSkippabilityEnable, ttsStop,
} from "@r2-navigator-js/electron/renderer";

import { readerLocalActionReader, readerLocalActionSetConfig } from "../actions";
import { SagaGenerator, all, put, select, spawn, take } from "typed-redux-saga";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { readerConfigInitialStateDefaultPublisher } from "readium-desktop/common/redux/states/reader";

function* readerConfigChanged(action: readerLocalActionSetConfig.TAction): SagaGenerator<void> {

    if (!action.payload) {
        throw new Error("NO READER CONFIG RECEIVED !!!");
    }

    const readerConfigFromReduxState = yield* select((state: IReaderRootState) => state.reader.config);
    const readerConfig = {
        ...readerConfigFromReduxState,
        ...action.payload,
    };

    const r2PublicationHasMediaOverlays = yield* select((state: IReaderRootState) => state.reader.info.navigator.r2PublicationHasMediaOverlays);
    const mediaOverlaysState = yield* select((state: IReaderRootState) => state.reader.mediaOverlay.state);
    const ttsState = yield* select((state: IReaderRootState) => state.reader.tts.state);
    const moWasPlaying = r2PublicationHasMediaOverlays && mediaOverlaysState === MediaOverlaysStateEnum.PLAYING;
    const ttsWasPlaying = ttsState !== TTSStateEnum.STOPPED;

    mediaOverlaysEnableSkippability(readerConfig.mediaOverlaysEnableSkippability);
    ttsSentenceDetectionEnable(readerConfig.ttsEnableSentenceDetection);
    ttsSkippabilityEnable(readerConfig.mediaOverlaysEnableSkippability);
    mediaOverlaysEnableCaptionsMode(readerConfig.mediaOverlaysEnableCaptionsMode);
    ttsOverlayEnable(readerConfig.ttsEnableOverlayMode);


    if (moWasPlaying) {
        mediaOverlaysPause();
        setTimeout(() => {
            mediaOverlaysResume();
        }, 300);
    }
    if (ttsWasPlaying) {
        ttsStop();
        setTimeout(() => {
            ttsPlay(parseFloat(readerConfig.ttsPlaybackRate), readerConfig.ttsVoice);
        }, 300);
    }

    // this.props.setConfig(readerConfig, this.props.session);
    // const sessionEnabled = yield* select((state: IReaderRootState) => state.session.state);

    // session never enabled in reader but always in main/lib
    // if (!sessionEnabled) {
        // see issue https://github.com/edrlab/thorium-reader/issues/2532
        // yield* put(readerActions.configSetDefault.build(readerConfig));
    // }

    readiumCssUpdate(computeReadiumCssJsonMessage(readerConfig));
}

function* alowCustomTriggered(action: readerLocalActionReader.allowCustom.TAction): SagaGenerator<void> {

    const { payload: { state: checked }} = action;

    if (checked) {

        const transientConfig = yield* select((state: IReaderRootState) => state.reader.transientConfig);
        yield* put(readerLocalActionSetConfig.build(transientConfig));

    } else {
        yield* put(readerLocalActionSetConfig.build(readerConfigInitialStateDefaultPublisher));
    }
}

export function saga() {
    return all([
        takeSpawnEvery(
            readerLocalActionSetConfig.ID,
            readerConfigChanged,
        ),
        takeSpawnEvery(
            readerLocalActionReader.allowCustom.ID,
            alowCustomTriggered,
        ),
        spawn(function* () {
            while (true) {
                const oldEnableMathJax = yield select((state: IReaderRootState) => state.reader.config.enableMathJax);
                yield take(readerLocalActionSetConfig.ID);
                const newEnableMathJax = yield select((state: IReaderRootState) => state.reader.config.enableMathJax);
                const shouldReload = oldEnableMathJax !== newEnableMathJax;
                if (shouldReload) {
                    setTimeout(() => {
                        // window.location.reload();
                        reloadContent();
                    }, 1000);
                }
            }
        }),
    ]);
}
