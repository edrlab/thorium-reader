// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import {
    R2_EVENT_AUDIO_DO_PAUSE, R2_EVENT_AUDIO_DO_PLAY, R2_EVENT_AUDIO_FORWARD, R2_EVENT_AUDIO_REWIND,
    R2_EVENT_AUDIO_TOGGLE_PLAY_PAUSE,
} from "../common/events";
import { ReadiumElectronBrowserWindow } from "./webview/state";

const win = global.window as ReadiumElectronBrowserWindow;

export function audioPlay() {
    const activeWebView = win.READIUM2.getFirstOrSecondWebView();
    if (!activeWebView) {
        return;
    }

    if (activeWebView.READIUM2?.DOMisReady) {
        activeWebView.send(R2_EVENT_AUDIO_DO_PLAY).then((_v) => { /* noop */ }).catch((_err) => { /* debug(err); */ });
    }
}

export function audioPause() {
    const activeWebView = win.READIUM2.getFirstOrSecondWebView();
    if (!activeWebView) {
        return;
    }

    if (activeWebView.READIUM2?.DOMisReady) {
        activeWebView.send(R2_EVENT_AUDIO_DO_PAUSE).then((_v) => { /* noop */ }).catch((_err) => { /* debug(err); */ });
    }
}

export function audioTogglePlayPause() {
    const activeWebView = win.READIUM2.getFirstOrSecondWebView();
    if (!activeWebView) {
        return;
    }

    if (activeWebView.READIUM2?.DOMisReady) {
        activeWebView.send(R2_EVENT_AUDIO_TOGGLE_PLAY_PAUSE).then((_v) => { /* noop */ }).catch((_err) => { /* debug(err); */ });
    }
}

export function audioRewind() {
    const activeWebView = win.READIUM2.getFirstOrSecondWebView();
    if (!activeWebView) {
        return;
    }

    if (activeWebView.READIUM2?.DOMisReady) {
        activeWebView.send(R2_EVENT_AUDIO_REWIND).then((_v) => { /* noop */ }).catch((_err) => { /* debug(err); */ });
    }
}

export function audioForward() {
    const activeWebView = win.READIUM2.getFirstOrSecondWebView();
    if (!activeWebView) {
        return;
    }

    if (activeWebView.READIUM2?.DOMisReady) {
        activeWebView.send(R2_EVENT_AUDIO_FORWARD).then((_v) => { /* noop */ }).catch((_err) => { /* debug(err); */ });
    }
}

// export function audioPlaybackRate(speed: number) {
//     const activeWebView = win.READIUM2.getFirstOrSecondWebView();
//     if (!activeWebView) {
//         return;
//     }

//     setTimeout(() => {
//    if (activeWebView.READIUM2?.DOMisReady) {}
//         const payload: IEventPayload_R2_EVENT_AUDIO_PLAYBACK_RATE = {
//             speed,
//         };
//         await activeWebView.send(R2_EVENT_AUDIO_PLAYBACK_RATE, payload);
//     }, 0);
// }

let _playbackRate = 1;
export function setCurrentAudioPlaybackRate(speed: number) {
    _playbackRate = speed;
}
export function getCurrentAudioPlaybackRate() {
    return _playbackRate;
}
