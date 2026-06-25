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

    setTimeout(() => {
        if (activeWebView.READIUM2?.DOMisReady) {
            void (async () => {
                try {
                    await activeWebView.send(R2_EVENT_AUDIO_DO_PLAY);
                } catch (_err) {
                    // debug(err);
                }
            })();
        }
    }, 0);
}

export function audioPause() {
    const activeWebView = win.READIUM2.getFirstOrSecondWebView();
    if (!activeWebView) {
        return;
    }

    setTimeout(() => {
        if (activeWebView.READIUM2?.DOMisReady) {
            void (async () => {
                try {
                    await activeWebView.send(R2_EVENT_AUDIO_DO_PAUSE);
                } catch (_err) {
                    // debug(err);
                }
            })();
        }
    }, 0);
}

export function audioTogglePlayPause() {
    const activeWebView = win.READIUM2.getFirstOrSecondWebView();
    if (!activeWebView) {
        return;
    }

    setTimeout(() => {
        if (activeWebView.READIUM2?.DOMisReady) {
            void (async () => {
                try {
                    await activeWebView.send(R2_EVENT_AUDIO_TOGGLE_PLAY_PAUSE);
                } catch (_err) {
                    // debug(err);
                }
            })();
        }
    }, 0);
}

export function audioRewind() {
    const activeWebView = win.READIUM2.getFirstOrSecondWebView();
    if (!activeWebView) {
        return;
    }

    setTimeout(() => {
        if (activeWebView.READIUM2?.DOMisReady) {
            void (async () => {
                try {
                    await activeWebView.send(R2_EVENT_AUDIO_REWIND);
                } catch (_err) {
                    // debug(err);
                }
            })();
        }
    }, 0);
}

export function audioForward() {
    const activeWebView = win.READIUM2.getFirstOrSecondWebView();
    if (!activeWebView) {
        return;
    }

    setTimeout(() => {
        if (activeWebView.READIUM2?.DOMisReady) {
            void (async () => {
                try {
                    await activeWebView.send(R2_EVENT_AUDIO_FORWARD);
                } catch (_err) {
                    // debug(err);
                }
            })();
        }
    }, 0);
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
