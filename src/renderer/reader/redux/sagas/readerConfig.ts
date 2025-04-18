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
    ttsSentenceDetectionEnable, ttsAndMediaOverlaysManualPlayNext, ttsSkippabilityEnable, ttsStop,
    ttsHighlightStyle,
    mediaOverlaysStop,
} from "@r2-navigator-js/electron/renderer";

import { readerLocalActionReader, readerLocalActionSetConfig } from "../actions";
import { SagaGenerator } from "typed-redux-saga";
import { all as allTyped, put as putTyped, select as selectTyped, spawn as spawnTyped, take as takeTyped } from "typed-redux-saga/macro";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { readerConfigInitialState, readerConfigInitialStateDefaultPublisher } from "readium-desktop/common/redux/states/reader";
import { isNotNil } from "readium-desktop/utils/nil";
import { DialogTypeName } from "readium-desktop/common/models/dialog";
import { DockTypeName } from "readium-desktop/common/models/dock";
import { dialogActions, dockActions } from "readium-desktop/common/redux/actions";
import { IReaderDialogOrDockSettingsMenuState } from "readium-desktop/common/models/reader";

function* readerConfigChanged(action: readerLocalActionSetConfig.TAction): SagaGenerator<void> {

    const { payload } = action;
    // payload must contain readerConfig keys that need to be updated

    // fine-graining the parsing of readerConfig to avoid too many rendering of the webview
    // and then reconciliate readerConfig to save it as default global config (configSetDefault)


    if (!payload) {
        throw new Error("NO READER CONFIG RECEIVED !!!");
    }


    const readerConfigFromReduxState = yield* selectTyped((state: IReaderRootState) => state.reader.config);
    const readerConfig = {
        ...readerConfigFromReduxState,
        ...payload,
    };

    if (isNotNil(payload.readerDockingMode)) {
        if (readerConfig.readerDockingMode === "full") {
            if (yield* selectTyped((state: IReaderRootState) => state.dialog.open && (state.dialog.type === DialogTypeName.ReaderMenu || state.dialog.type === DialogTypeName.ReaderSettings))) {
                // nothing
            } else {
                if (yield* selectTyped((state: IReaderRootState) => state.dock.open && (state.dock.type === DockTypeName.ReaderMenu || state.dock.type === DockTypeName.ReaderSettings))) {
                    const {data, type} = yield* selectTyped((state: IReaderRootState) => state.dock);
                    const dialogType = type === DockTypeName.ReaderMenu ? DialogTypeName.ReaderMenu : DialogTypeName.ReaderSettings;
                    yield* putTyped(dialogActions.openRequest.build(dialogType, data));;
                    yield* putTyped(dockActions.closeRequest.build());
                }
            }
        } else {
            if (yield* selectTyped((state: IReaderRootState) => state.dock.open && (state.dock.type === DockTypeName.ReaderMenu || state.dock.type === DockTypeName.ReaderSettings))) {
                // nothing
            } else {
                if (yield* selectTyped((state: IReaderRootState) => state.dialog.open && (state.dialog.type === DialogTypeName.ReaderMenu || state.dialog.type === DialogTypeName.ReaderSettings))) {
                    const {data, type} = yield* selectTyped((state: IReaderRootState) => state.dialog);
                    const dockType = type === DialogTypeName.ReaderMenu ? DockTypeName.ReaderMenu : DockTypeName.ReaderSettings;
                    yield* putTyped(dockActions.openRequest.build(dockType, data as IReaderDialogOrDockSettingsMenuState));;
                    yield* putTyped(dialogActions.closeRequest.build());
                }
            }
        }
    }

    if (isNotNil(payload.mediaOverlaysEnableSkippability)) {
        mediaOverlaysEnableSkippability(readerConfig.mediaOverlaysEnableSkippability);
    }

    if (isNotNil(payload.ttsEnableSentenceDetection)) {
        ttsSentenceDetectionEnable(readerConfig.ttsEnableSentenceDetection);
    }

    if (isNotNil(payload.ttsAndMediaOverlaysDisableContinuousPlay)) {
        ttsAndMediaOverlaysManualPlayNext(readerConfig.ttsAndMediaOverlaysDisableContinuousPlay);
    }

    if (isNotNil(payload.ttsHighlightStyle) || isNotNil(payload.ttsHighlightStyle_WORD) || isNotNil(payload.ttsHighlightColor) || isNotNil(payload.ttsHighlightColor_WORD)) {
        ttsHighlightStyle(
            typeof readerConfig.ttsHighlightStyle === "undefined" || readerConfig.ttsHighlightStyle === null ? readerConfigInitialState.ttsHighlightStyle : readerConfig.ttsHighlightStyle,
            !readerConfig.ttsHighlightColor ? readerConfigInitialState.ttsHighlightColor : readerConfig.ttsHighlightColor,
            typeof readerConfig.ttsHighlightStyle_WORD === "undefined" || readerConfig.ttsHighlightStyle_WORD === null ? readerConfigInitialState.ttsHighlightStyle_WORD : readerConfig.ttsHighlightStyle_WORD,
            !readerConfig.ttsHighlightColor_WORD ? readerConfigInitialState.ttsHighlightColor_WORD : readerConfig.ttsHighlightColor_WORD,
        );
    }

    if (isNotNil(payload.mediaOverlaysEnableSkippability)) {
        ttsSkippabilityEnable(readerConfig.mediaOverlaysEnableSkippability);
    }

    if (isNotNil(payload.mediaOverlaysEnableCaptionsMode)) {
        mediaOverlaysEnableCaptionsMode(readerConfig.mediaOverlaysEnableCaptionsMode);
    }

    if (isNotNil(payload.ttsEnableOverlayMode)) {
        ttsOverlayEnable(readerConfig.ttsEnableOverlayMode);
    }

    if (isNotNil(payload.mediaOverlaysIgnoreAndUseTTS)) {

        const r2PublicationHasMediaOverlays = yield* selectTyped((state: IReaderRootState) => state.reader.info.navigator.r2PublicationHasMediaOverlays);
        const mediaOverlaysState = yield* selectTyped((state: IReaderRootState) => state.reader.mediaOverlay.state);
        const moWasPlaying = r2PublicationHasMediaOverlays && mediaOverlaysState !== MediaOverlaysStateEnum.STOPPED;
        const ttsState = yield* selectTyped((state: IReaderRootState) => state.reader.tts.state);
        const ttsWasPlaying = ttsState !== TTSStateEnum.STOPPED;

        console.log("r2PublicationHasMediaOverlays", r2PublicationHasMediaOverlays);
        console.log("ttsWasPlaying -- ttsState !== TTSStateEnum.STOPPED", ttsState !== TTSStateEnum.STOPPED);
        console.log("moWasPlaying -- mediaOverlaysState !== MediaOverlaysStateEnum.STOPPED", mediaOverlaysState !== MediaOverlaysStateEnum.STOPPED);

        if (moWasPlaying) {
            mediaOverlaysStop();
            // TODO: calling raw ttsPlay() or mediaOverlaysPlay() doesn't work here, after STOP we should invoke this.props.handleMediaOverlaysPlay() or this.props.handleTTSPlay() see ReaderHeader.tsx / Reader.tsx
            // setTimeout(() => {
            //     if (payload.mediaOverlaysIgnoreAndUseTTS) {
            //         ttsPlay(parseFloat(readerConfig.ttsPlaybackRate), readerConfig.ttsVoices);
            //     } else {
            //         mediaOverlaysPlay(parseFloat(readerConfig.mediaOverlaysPlaybackRate));
            //     }
            // }, 300);
        } else if (ttsWasPlaying) {
            ttsStop();
            // TODO: calling raw ttsPlay() or mediaOverlaysPlay() doesn't work here, after STOP we should invoke this.props.handleMediaOverlaysPlay() or this.props.handleTTSPlay() see ReaderHeader.tsx / Reader.tsx
            // setTimeout(() => {
            //     if (!payload.mediaOverlaysIgnoreAndUseTTS) {
            //         ttsPlay(parseFloat(readerConfig.ttsPlaybackRate), readerConfig.ttsVoices);
            //     } else {
            //         mediaOverlaysPlay(parseFloat(readerConfig.mediaOverlaysPlaybackRate));
            //     }
            // }, 300);
        }
    }

    if (isNotNil(payload.mediaOverlaysEnableCaptionsMode) || isNotNil(payload.mediaOverlaysEnableSkippability) || isNotNil(payload.mediaOverlaysPlaybackRate)) {

        const r2PublicationHasMediaOverlays = yield* selectTyped((state: IReaderRootState) => state.reader.info.navigator.r2PublicationHasMediaOverlays);
        const mediaOverlaysState = yield* selectTyped((state: IReaderRootState) => state.reader.mediaOverlay.state);
        const moWasPlaying = r2PublicationHasMediaOverlays && mediaOverlaysState === MediaOverlaysStateEnum.PLAYING;
        if (moWasPlaying) {
            mediaOverlaysPause();
            setTimeout(() => {
                mediaOverlaysResume();
            }, 300);
        }
    }

    if (
        // (isNotNil(payload.ttsVoices) && payload.ttsVoices.length) ||
        // isNotNil(payload.ttsPlaybackRate) ||
        isNotNil(payload.ttsEnableOverlayMode) ||
        isNotNil(payload.ttsEnableSentenceDetection)
    ) {
        const ttsState = yield* selectTyped((state: IReaderRootState) => state.reader.tts.state);
        const ttsWasPlaying = ttsState !== TTSStateEnum.STOPPED;
        if (ttsWasPlaying) {
            ttsStop();
            setTimeout(() => {
                ttsPlay(parseFloat(readerConfig.ttsPlaybackRate), readerConfig.ttsVoices);
            }, 300);
        }
    }


    // this.props.setConfig(readerConfig, this.props.session);
    // const sessionEnabled = yield* select((state: IReaderRootState) => state.session.state);

    // session never enabled in reader but always in main/lib
    // if (!sessionEnabled) {
        // see issue https://github.com/edrlab/thorium-reader/issues/2532
        // yield* put(readerActions.configSetDefault.build(readerConfig));
    // }

    if (
        isNotNil(payload.fontSize)          ||
        isNotNil(payload.pageMargins)       ||
        isNotNil(payload.wordSpacing)       ||
        isNotNil(payload.letterSpacing)     ||
        isNotNil(payload.paraSpacing)       ||
        isNotNil(payload.lineHeight)        ||
        isNotNil(payload.align)             ||
        isNotNil(payload.theme)             ||
        isNotNil(payload.colCount)          ||
        isNotNil(payload.font)              ||
        isNotNil(payload.sepia)             ||
        isNotNil(payload.night)             ||
        isNotNil(payload.invert)            ||
        isNotNil(payload.paged)             ||
        // isNotNil(payload.readiumcss)     ||
        isNotNil(payload.enableMathJax)     ||
        isNotNil(payload.reduceMotion)      ||
        isNotNil(payload.noFootnotes)       ||
        isNotNil(payload.noTemporaryNavTargetOutline) ||
        isNotNil(payload.noRuby)            ||
        isNotNil(payload.darken)
    ) {
        readiumCssUpdate(computeReadiumCssJsonMessage(readerConfig));
    }
}

function* alowCustomTriggered(action: readerLocalActionReader.allowCustom.TAction): SagaGenerator<void> {

    const { payload: { state: checked }} = action;

    if (checked) {

        const transientConfig = yield* selectTyped((state: IReaderRootState) => state.reader.transientConfig);
        yield* putTyped(readerLocalActionSetConfig.build(transientConfig));

    } else {
        yield* putTyped(readerLocalActionSetConfig.build(readerConfigInitialStateDefaultPublisher));
    }
}

export function saga() {
    return allTyped([
        takeSpawnEvery(
            readerLocalActionSetConfig.ID,
            readerConfigChanged,
        ),
        takeSpawnEvery(
            readerLocalActionReader.allowCustom.ID,
            alowCustomTriggered,
        ),
        spawnTyped(function* () {
            while (true) {
                const oldEnableMathJax = yield* selectTyped((state: IReaderRootState) => state.reader.config.enableMathJax);
                yield* takeTyped(readerLocalActionSetConfig.ID);
                const newEnableMathJax = yield* selectTyped((state: IReaderRootState) => state.reader.config.enableMathJax);
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
