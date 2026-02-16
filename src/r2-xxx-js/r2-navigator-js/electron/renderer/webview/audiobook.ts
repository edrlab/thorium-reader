// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debounce from "debounce";
import { ipcRenderer } from "electron";

import { DEBUG_AUDIO } from "../../common/audiobook";
import {
    IEventPayload_R2_EVENT_AUDIO_PLAYBACK_RATE, IEventPayload_R2_EVENT_PAGE_TURN,
    IEventPayload_R2_EVENT_READING_LOCATION, R2_EVENT_AUDIO_DO_PAUSE, R2_EVENT_AUDIO_DO_PLAY,
    R2_EVENT_AUDIO_FORWARD, R2_EVENT_AUDIO_PLAYBACK_RATE, R2_EVENT_AUDIO_REWIND,
    R2_EVENT_AUDIO_TOGGLE_PLAY_PAUSE, R2_EVENT_PAGE_TURN_RES, R2_EVENT_READING_LOCATION,
} from "../../common/events";
import {
    AUDIO_BUFFER_CANVAS_ID, AUDIO_COVER_ID, AUDIO_FORWARD_ID, AUDIO_ID, AUDIO_NEXT_ID,
    AUDIO_PERCENT_ID, AUDIO_PLAYPAUSE_ID, AUDIO_PREVIOUS_ID, AUDIO_PROGRESS_CLASS, AUDIO_RATE_ID,
    AUDIO_REWIND_ID, AUDIO_SLIDER_ID, AUDIO_TIME_ID,
} from "../../common/styles";
import { ReadiumElectronWebviewWindow } from "./state";

const win = global.window as ReadiumElectronWebviewWindow;

let __locEventID = 0;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function throttle(fn: (...argz: any[]) => any, time: number) {
    let called = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (...args: any[]) => {
        if (!called) {
            fn(...args);
            called = true;
            setTimeout(() => {
                called = false;
            }, time);
        }
    };
}

export function setupAudioBook(_docTitle: string | undefined, audioPlaybackRate: number | undefined) {

    win.document.documentElement.classList.add(AUDIO_PROGRESS_CLASS);

    const coverElement = win.document.getElementById(AUDIO_COVER_ID) as HTMLImageElement;
    const audioElement = win.document.getElementById(AUDIO_ID) as HTMLAudioElement;
    const sliderElement = win.document.getElementById(AUDIO_SLIDER_ID) as HTMLInputElement;
    const timeElement = win.document.getElementById(AUDIO_TIME_ID) as HTMLSpanElement;
    const percentElement = win.document.getElementById(AUDIO_PERCENT_ID) as HTMLSpanElement;
    const playPauseElement = win.document.getElementById(AUDIO_PLAYPAUSE_ID) as HTMLButtonElement;
    const previousElement = win.document.getElementById(AUDIO_PREVIOUS_ID) as HTMLButtonElement;
    const nextElement = win.document.getElementById(AUDIO_NEXT_ID) as HTMLButtonElement;
    const rewindElement = win.document.getElementById(AUDIO_REWIND_ID) as HTMLButtonElement;
    const forwardElement = win.document.getElementById(AUDIO_FORWARD_ID) as HTMLButtonElement;
    const rateElement = win.document.getElementById(AUDIO_RATE_ID) as HTMLSelectElement;

    if (audioPlaybackRate) {
        rateElement.value = `${audioPlaybackRate}`;
    } else {
        rateElement.value = `${audioElement.playbackRate}`;
    }
    rateElement.addEventListener("change", () => {
        const speed = parseFloat(rateElement.value);
        audioElement.playbackRate = speed;

        const payload: IEventPayload_R2_EVENT_AUDIO_PLAYBACK_RATE = {
            speed,
        };
        ipcRenderer.sendToHost(R2_EVENT_AUDIO_PLAYBACK_RATE, payload);
    });
    // audioElement.addEventListener("ratechange", () => {
    //     // TODO: what if select/option does not include the string value?
    //     rateElement.value = `${audioElement.playbackRate}`;
    // });

    function refreshTimeElements(p: number) {

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const prettyPercent = (percentElement as any).displayAlt ? `${p}%` : `${formatTime(audioElement.duration)}`;
        percentElement.innerText = prettyPercent;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        // const prettyTime = `${formatTime(audioElement.currentTime)} / ${formatTime(audioElement.duration)}`;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const prettyTime = (timeElement as any).displayAlt ?
            `-${formatTime(audioElement.duration - audioElement.currentTime)}` :
            `${formatTime(audioElement.currentTime)}`;
        timeElement.innerText = prettyTime;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function onTimeElementsClick(el: any) {

        if (el.displayAlt) {
            el.displayAlt = false;
        } else {
            el.displayAlt = true;
        }

        const percent = audioElement.currentTime / audioElement.duration;
        const p = Math.round(percent * 100);
        refreshTimeElements(p);
    }
    timeElement.addEventListener("click", () => {
        onTimeElementsClick(timeElement);
    });
    percentElement.addEventListener("click", () => {
        onTimeElementsClick(percentElement);
    });

    const bufferCanvasElement = DEBUG_AUDIO ?
        win.document.getElementById(AUDIO_BUFFER_CANVAS_ID) as HTMLCanvasElement : undefined;
    if (bufferCanvasElement) {
        const context = bufferCanvasElement.getContext("2d");
        if (context) {

            const refreshBufferCanvas = () => {
                const pixelsPerSecond = bufferCanvasElement.width / audioElement.duration;

                context.fillStyle = "red";
                context.fillRect(0, 0, bufferCanvasElement.width, bufferCanvasElement.height);

                context.fillStyle = "green";
                context.strokeStyle = "magenta";

                console.log(`audio -- buffered.length: ${audioElement.buffered.length}`);
                for (let i = 0; i < audioElement.buffered.length; i++) {

                    const start = audioElement.buffered.start(i);
                    const end = audioElement.buffered.end(i);

                    console.log(`audio -- buffered: ${start} ... ${end}`);

                    const x1 = start * pixelsPerSecond;
                    const x2 = end * pixelsPerSecond;
                    const w = x2 - x1;

                    context.fillRect(x1, 0, w, bufferCanvasElement.height);
                    context.rect(x1, 0, w, bufferCanvasElement.height);
                    context.stroke();
                }
            };
            const refreshBufferCanvasThrottled = throttle(() => {
                refreshBufferCanvas();
            }, 500);

            context.fillStyle = "silver";
            context.fillRect(0, 0, bufferCanvasElement.width, bufferCanvasElement.height);

            audioElement.addEventListener("timeupdate", () => {
                if (audioElement.duration <= 0) {
                    return;
                }
                refreshBufferCanvasThrottled();
            });
        }
    }

    function rewind() {
        const newTime = Math.max(0, audioElement.currentTime - 30);
        audioElement.currentTime = newTime;
        // if (newTime < 0.5) {
        //     const payload: IEventPayload_R2_EVENT_PAGE_TURN = {
        //         direction: "LTR",
        //         go: "PREVIOUS",
        //     };
        //     ipcRenderer.sendToHost(R2_EVENT_PAGE_TURN_RES, payload);
        // } else {
        //     audioElement.currentTime = newTime;
        // }
    }
    rewindElement.addEventListener("click", () => {
        rewind();
    });
    function forward() {
        const newTime = Math.min(audioElement.duration, audioElement.currentTime + 30);
        audioElement.currentTime = newTime;
        // if (newTime >= audioElement.duration - 0.5) {
        //     const payload: IEventPayload_R2_EVENT_PAGE_TURN = {
        //         direction: "LTR",
        //         go: "NEXT",
        //     };
        //     ipcRenderer.sendToHost(R2_EVENT_PAGE_TURN_RES, payload);
        // } else {
        //     audioElement.currentTime = newTime;
        // }
    }
    forwardElement.addEventListener("click", () => {
        forward();
    });

    previousElement.addEventListener("click", () => {
        const payload: IEventPayload_R2_EVENT_PAGE_TURN = {
            // direction: "LTR",
            go: "PREVIOUS",
        };
        ipcRenderer.sendToHost(R2_EVENT_PAGE_TURN_RES, payload);
    });
    nextElement.addEventListener("click", () => {
        const payload: IEventPayload_R2_EVENT_PAGE_TURN = {
            // direction: "LTR",
            go: "NEXT",
        };
        ipcRenderer.sendToHost(R2_EVENT_PAGE_TURN_RES, payload);
    });

    // const debounceSlider = debounce((wasPlaying: boolean | undefined) => {
    //     const p = sliderElement.valueAsNumber / 100;
    //     audioElement.currentTime = audioElement.duration * p;
    //     if (wasPlaying) {
    //         setTimeout(async () => {
    //             await audioElement.play();
    //         }, 200);
    //     }
    // }, 500);
    sliderElement.addEventListener("input", () => {

        const p = sliderElement.valueAsNumber / 100;
        audioElement.currentTime = audioElement.duration * p;

        sliderElement.style.setProperty("--audiopercent", `${sliderElement.valueAsNumber}%`);

        // const wasPlaying = win.READIUM2.locationHashOverrideInfo?.audioPlaybackInfo?.isPlaying;
        // audioElement.pause();
        // debounceSlider(wasPlaying);
    });
    function togglePlayPause() {
        if (win.READIUM2.locationHashOverrideInfo &&
            win.READIUM2.locationHashOverrideInfo.audioPlaybackInfo) {
            const isPlaying = win.READIUM2.locationHashOverrideInfo.audioPlaybackInfo.isPlaying;
            if (isPlaying) {
                audioElement.pause();
            } else {
                if (audioElement.currentTime >= audioElement.duration - 0.5) {
                    const payload: IEventPayload_R2_EVENT_PAGE_TURN = {
                        // direction: "LTR",
                        go: "NEXT",
                    };
                    ipcRenderer.sendToHost(R2_EVENT_PAGE_TURN_RES, payload);
                } else {
                    setTimeout(async () => {
                        await audioElement.play();
                    }, 0);
                }
            }
        }
    }
    if (coverElement) {
        coverElement.addEventListener("mouseup", (ev) => {
            if (ev.button === 0) {
                togglePlayPause();
            }
        });
    }
    playPauseElement.addEventListener("click", () => {
        togglePlayPause();
    });

    function formatTime(seconds: number): string {
        const secondsPerMinute = 60;
        const minutesPerHours = 60;
        const secondsPerHour = minutesPerHours * secondsPerMinute;
        let remainingSeconds = seconds;
        const nHours = Math.floor(remainingSeconds / secondsPerHour);
        remainingSeconds -= (nHours * secondsPerHour);
        if (remainingSeconds < 0) {
            remainingSeconds = 0;
        }
        const nMinutes = Math.floor(remainingSeconds / secondsPerMinute);
        remainingSeconds -= (nMinutes * secondsPerMinute);
        if (remainingSeconds < 0) {
            remainingSeconds = 0;
        }
        remainingSeconds = Math.floor(remainingSeconds);
        return `${nHours > 0 ? (nHours.toString().padStart(2, "0") + ":") : ""}${nMinutes > 0 ? (nMinutes.toString().padStart(2, "0") + ":") : "00:"}${remainingSeconds > 0 ? (remainingSeconds.toString().padStart(2, "0")) : "00"}`;
    }

    function notifyPlaybackLocation() {
        const percent = audioElement.currentTime / audioElement.duration;
        const p = Math.round(percent * 100);

        refreshTimeElements(p);

        // sliderElement.value = "" + p;
        sliderElement.valueAsNumber = p;
        sliderElement.style.setProperty("--audiopercent", `${p}%`);

        if (__locEventID >= Number.MAX_SAFE_INTEGER) {
            __locEventID = 0;
        }
        win.READIUM2.locationHashOverrideInfo = {
            locEventID: ++__locEventID, // 1-based
            audioPlaybackInfo: {
                globalDuration: undefined,
                globalProgression: undefined,
                globalTime: undefined,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                isPlaying: (audioElement as any).isPlaying,
                localDuration: audioElement.duration,
                localProgression: percent,
                localTime: audioElement.currentTime,
            },
            docInfo: {
                isFixedLayout: false,
                isRightToLeft: false,
                isVerticalWritingMode: false,
            },
            epubPage: undefined,
            epubPageID: undefined,
            headings: undefined,
            href: "", // filled-in from host index.js renderer
            locations: {
                cfi: undefined,
                cssSelector: undefined,
                    // calculated in host index.js renderer, where publication object is available
                position: undefined,
                progression: percent,
            },
            paginationInfo: undefined,
            secondWebViewHref: undefined,
            selectionInfo: undefined,
            selectionIsNew: undefined,
            text: undefined,
            title: _docTitle,
            userInteract: false,
        };
        const payload: IEventPayload_R2_EVENT_READING_LOCATION = win.READIUM2.locationHashOverrideInfo;
        ipcRenderer.sendToHost(R2_EVENT_READING_LOCATION, payload);
    }
    const notifyPlaybackLocationThrottled = throttle(() => {
        notifyPlaybackLocation();
    }, 1000);

    // const notifyPlaybackLocationDebounced = debounce(() => {
    //     notifyPlaybackLocation();
    // }, 200);

    const progressDebounced = debounce((progress: boolean) => {
        if (progress) {
            win.document.documentElement.classList.add(AUDIO_PROGRESS_CLASS);
        } else {
            win.document.documentElement.classList.remove(AUDIO_PROGRESS_CLASS);
        }
    }, 150);

    audioElement.addEventListener("play", () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (audioElement as any).isPlaying = true;
        playPauseElement.classList.add("pause");
        notifyPlaybackLocation();
    });
    audioElement.addEventListener("pause", () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (audioElement as any).isPlaying = false;
        playPauseElement.classList.remove("pause");
        notifyPlaybackLocation();
    });
    audioElement.addEventListener("seeking", () => {
        progressDebounced(true);
    });
    audioElement.addEventListener("canplay", () => {
        progressDebounced(false);
    });
    audioElement.addEventListener("ended", () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (audioElement as any).isPlaying = false;
        playPauseElement.classList.remove("pause");
        notifyPlaybackLocation();
        const payload: IEventPayload_R2_EVENT_PAGE_TURN = {
            // direction: "LTR",
            go: "NEXT",
        };
        ipcRenderer.sendToHost(R2_EVENT_PAGE_TURN_RES, payload);
    });

    audioElement.addEventListener("timeupdate", () => {
        // (audioElement as any).isPlaying = true;
        notifyPlaybackLocationThrottled();
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ipcRenderer.on(R2_EVENT_AUDIO_DO_PLAY, async (_event: any) => {
        await audioElement.play();
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ipcRenderer.on(R2_EVENT_AUDIO_DO_PAUSE, (_event: any) => {
        audioElement.pause();
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ipcRenderer.on(R2_EVENT_AUDIO_DO_PLAY, async (_event: any) => {
        await audioElement.play();
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ipcRenderer.on(R2_EVENT_AUDIO_TOGGLE_PLAY_PAUSE, (_event: any) => {
        togglePlayPause();
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ipcRenderer.on(R2_EVENT_AUDIO_REWIND, (_event: any) => {
        rewind();
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ipcRenderer.on(R2_EVENT_AUDIO_FORWARD, (_event: any) => {
        forward();
    });
    // ipcRenderer.on(R2_EVENT_AUDIO_PLAYBACK_RATE,
    //     (_event: any, payload: IEventPayload_R2_EVENT_AUDIO_PLAYBACK_RATE) => {

    //     audioElement.playbackRate = payload.speed;
    // });
}
