// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import {
    IEventPayload_R2_EVENT_AUDIO_SOUNDTRACK, R2_EVENT_AUDIO_SOUNDTRACK,
} from "../common/events";
import { IReadiumElectronWebview } from "./webview/state";

// const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
// const win = global.window as ReadiumElectronBrowserWindow;

export function soundtrackHandleIpcMessage(
    eventChannel: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    eventArgs: any[],
    _eventCurrentTarget: IReadiumElectronWebview): boolean {

    if (eventChannel === R2_EVENT_AUDIO_SOUNDTRACK) {
        // debug("R2_EVENT_AUDIO_SOUNDTRACK (webview.addEventListener('ipc-message')");
        const payload = eventArgs[0] as IEventPayload_R2_EVENT_AUDIO_SOUNDTRACK;
        handleAudioSoundTrack(payload.url);
    } else {
        return false;
    }
    return true;
}

const AUDIO_SOUNDTRACK_ID = "R2_AUDIO_SOUNDTRACK_ID";
let _currentAudioSoundTrack: string | undefined;
function handleAudioSoundTrack(url: string) {
    if (url === _currentAudioSoundTrack) {
        return;
    }
    _currentAudioSoundTrack = url;
    let audioEl = document.getElementById(AUDIO_SOUNDTRACK_ID);
    if (audioEl && audioEl.parentNode) {
        audioEl.parentNode.removeChild(audioEl);
    }
    audioEl = document.createElement("audio"); // no controls => should be invisible
    audioEl.setAttribute("style", "display: none");
    audioEl.setAttribute("id", AUDIO_SOUNDTRACK_ID);
    audioEl.setAttribute("src", url);
    audioEl.setAttribute("loop", "loop");
    audioEl.setAttribute("autoplay", "autoplay");
    audioEl.setAttribute("role", "ibooks:soundtrack"); // epub:type
    document.body.appendChild(audioEl);
}
