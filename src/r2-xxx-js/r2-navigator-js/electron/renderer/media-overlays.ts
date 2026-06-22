// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";
import * as util from "util";

import { getCurrentReadingLocation } from "./location";

import { TaJsonDeserialize } from "@r2-lcp-js/serializable";
import { MediaOverlayNode } from "@r2-shared-js/models/media-overlay";
import { Publication } from "@r2-shared-js/models/publication";
import { Link } from "@r2-shared-js/models/publication-link";

import { DEBUG_AUDIO } from "../common/audiobook";
import {
    IEventPayload_R2_EVENT_MEDIA_OVERLAY_CLICK, IEventPayload_R2_EVENT_MEDIA_OVERLAY_HIGHLIGHT,
    IEventPayload_R2_EVENT_MEDIA_OVERLAY_STATE, R2_EVENT_MEDIA_OVERLAY_STATE, MediaOverlaysStateEnum as MediaOverlaysStateEnum_,
    IEventPayload_R2_EVENT_MEDIA_OVERLAY_STARTSTOP, R2_EVENT_MEDIA_OVERLAY_CLICK,
    R2_EVENT_MEDIA_OVERLAY_HIGHLIGHT, R2_EVENT_MEDIA_OVERLAY_STARTSTOP, IEventPayload_R2_EVENT_READING_LOCATION,
} from "../common/events";
import { handleLinkUrl, navPreviousOrNext } from "./location";
import { ReadiumElectronBrowserWindow, IReadiumElectronWebview } from "./webview/state";

// export enum MediaOverlaysStateEnum {
//     PAUSED = "PAUSED",
//     PLAYING = "PLAYING",
//     STOPPED = "STOPPED",
// }
export { MediaOverlaysStateEnum_ as MediaOverlaysStateEnum };

// import { READIUM2_ELECTRON_HTTP_PROTOCOL, convertCustomSchemeToHttpUrl } from "../common/sessions";

const debug = debug_("r2:navigator#electron/renderer/media-overlays");

const IS_DEV = process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev";

const win = global.window as ReadiumElectronBrowserWindow;

const AUDIO_MO_ID = "R2_AUDIO_MO_ID";

export function publicationHasMediaOverlays(publication: Publication) {
    if (publication.Spine) {
        const firstMoLink = publication.Spine.find((link) => {
            if (link.Properties?.MediaOverlay) {
                return true;
            }
            if (link.Alternate) {
                for (const altLink of link.Alternate) {
                    if (altLink.TypeLink === "application/vnd.syncnarr+json") {
                        return true;
                    }
                }
            }
            return false;
        });
        if (firstMoLink) {
            return true;
        }
    }
    return false;
}

let _captionsMode = false;
// let _useTTSHighlights = false;

let _mediaOverlaysClickEnabled = false;
let _mediaOverlaysPlaybackRate = 1;

// URL without t=begin,end media fragment! (pure audio reference)
let _currentAudioUrl: string | undefined;
let _previousAudioUrl: string | undefined;

let _currentAudioBegin: number | undefined;
// let _previousAudioBegin: number | undefined;

let _currentAudioEnd: number | undefined;
let _previousAudioEnd: number | undefined;

let _currentAudioElement: HTMLAudioElement | undefined;

let _mediaOverlayRoot: MediaOverlayNode | undefined;
let _mediaOverlayTextAudioPair: MediaOverlayNode | undefined;
let _mediaOverlayTextId: string | undefined;
let _mediaOverlayTextHref: string | undefined;

let _mediaOverlayActive = false;

async function playMediaOverlays(
    textHref: string,
    rootMo: MediaOverlayNode,
    textFragmentIDChain: Array<string | null> | undefined,
    isInteract: boolean) {

    if (IS_DEV) {
        debug("playMediaOverlays() : " + textHref + " //// " + decodeURIComponent(textHref));
        debug(JSON.stringify(textFragmentIDChain, null, 4));
    }

    const loc = getCurrentReadingLocation();
    const locationHashOverrideInfo = _lastClickedNotification?.locationHashOverrideInfo;

    if (!textFragmentIDChain) {
        if (loc) {
            if (IS_DEV) {
                debug("playMediaOverlays() CURRENT LOCATOR " + textHref + " -- " + loc.locator?.href);
                debug(JSON.stringify(loc, null, 4));
            }
            const hrefUrlObj = new URL("https://dummy.com/" + loc.locator?.href);
            if (textHref === hrefUrlObj.pathname.substr(1)) { // includes leading slash
                if (loc.locator.locations?.cssSelector) {
                    debug("playMediaOverlays() CSS SELECTOR: " + loc.locator.locations.cssSelector);
                    const hashI = loc.locator.locations.cssSelector.lastIndexOf("#");
                    if (hashI >= 0) {
                        const after = loc.locator.locations.cssSelector.substring(hashI + 1);
                        if (after) {
                            const spaceI = after.indexOf(" ");
                            let hashID = after;
                            if (spaceI > 0) {
                                hashID = after.substring(0, spaceI);
                            }
                            debug("playMediaOverlays() CSS SELECTOR ID: " + hashID);
                            // textFragmentIDChain = [hashID];
                        }
                    }
                }
                if (loc.locator.locations?.cfi) {
                    debug("playMediaOverlays() CFI: " + loc.locator.locations.cfi);
                    let arrayIDs: string[] = [];
                    const regexpr = /\[([^\]]+)\]/g;
                    const matches = loc.locator.locations.cfi.matchAll(regexpr);
                    // debug("playMediaOverlays() CFI MATCHES: " + JSON.stringify(matches, null, 4));
                    if (matches) {
                        arrayIDs = Array.from(matches, (m) => m[1]);
                    }
                    // let match;
                    // while (match = regexpr.exec(loc.locator.locations.cfi)) {
                    //     arrayIDs.push(match[1]);
                    // }
                    debug("playMediaOverlays() CFI IDs: " + JSON.stringify(arrayIDs, null, 4));
                    textFragmentIDChain = arrayIDs;
                }
            }
        }
    }

    let textFragmentIDChain_: Array<string> | undefined | null = textFragmentIDChain ? textFragmentIDChain.filter((id) => id) as Array<string> : undefined;
    if (textFragmentIDChain_ && textFragmentIDChain_.length === 0) {
        textFragmentIDChain_ = null;
    }

    let moTextAudioPair = findDepthFirstTextAudioPair(textHref, rootMo, textFragmentIDChain_, false);
    if (!moTextAudioPair && (textFragmentIDChain_ || textFragmentIDChain_ === null && !isInteract)) {
        const followingElementIDs = loc?.followingElementIDs || locationHashOverrideInfo?.followingElementIDs;
        if (followingElementIDs) {
            if (IS_DEV) {
                debug("playMediaOverlays() - findDepthFirstTextAudioPair() SECOND CHANCE TRY ... ");
                debug(JSON.stringify(textFragmentIDChain_, null, 4));
                debug(JSON.stringify(followingElementIDs, null, 4));
            }
            for (const id of followingElementIDs) {
                moTextAudioPair = findDepthFirstTextAudioPair(textHref, rootMo, [id], false);
                if (moTextAudioPair) {
                    debug("playMediaOverlays() - findDepthFirstTextAudioPair() SECOND CHANCE FOUND: " + id);
                    break;
                }
            }
        }
        if (!moTextAudioPair) {
            debug("playMediaOverlays() - findDepthFirstTextAudioPair() SECOND CHANCE FALLBACK...");
            moTextAudioPair = findDepthFirstTextAudioPair(textHref, rootMo, textFragmentIDChain_, true);
        }
        if (!moTextAudioPair && !isInteract) {
            debug("playMediaOverlays() - findDepthFirstTextAudioPair() THIRD CHANCE FALLBACK...");
            moTextAudioPair = findDepthFirstTextAudioPair(textHref, rootMo, undefined, false);
        }
        // if (textFragmentIDChain) {
        //     if (IS_DEV) {
        //         debug("playMediaOverlays() - findDepthFirstTextAudioPair() SECOND CHANCE SKIP (jump back to body begin not desirable)");
        //         debug(JSON.stringify(textFragmentIDChain, null, 4));
        //         debug(JSON.stringify(textFragmentIDChain_, null, 4));
        //     }
        // } else {
        //     if (IS_DEV) {
        //         debug("playMediaOverlays() - findDepthFirstTextAudioPair() SECOND CHANCE ");
        //         debug(JSON.stringify(textFragmentIDChain_, null, 4));
        //         debug(JSON.stringify(rootMo, null, 4));
        //     }
        //     moTextAudioPair = findDepthFirstTextAudioPair(textHref, rootMo, undefined);
        // }
    }
    if (moTextAudioPair) {
        if (moTextAudioPair.Audio || moTextAudioPair.Video) {
            if (IS_DEV) {
                debug("playMediaOverlays() - playMediaOverlaysAudio()");
            }
            _mediaOverlayRoot = rootMo;
            await playMediaOverlaysAudio(moTextAudioPair, undefined, undefined);
            mediaOverlaysStateSet(MediaOverlaysStateEnum_.PLAYING);
        } else {
            debug("playMediaOverlays() - moTextAudioPair BUT NOT moTextAudioPair.Audio || moTextAudioPair.Video" + textHref);

            _mediaOverlayRoot = rootMo;
            await playMediaOverlaysAudio(moTextAudioPair, undefined, undefined);
            mediaOverlaysStateSet(MediaOverlaysStateEnum_.PLAYING);
        }
    } else {
        if (IS_DEV) {
            debug("playMediaOverlays() - !moTextAudioPair " + textHref);
        }
    }
}

const ontimeupdate = async (ev: Event) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (_currentAudioElement && (_currentAudioElement as any).__draggable && (_currentAudioElement as any).__hidden) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (_currentAudioElement as any).__hidden = false;
        _currentAudioElement.style.display = "block";
    }
    const currentAudioElement = ev.currentTarget as HTMLAudioElement; // _currentAudioElement

    // debug("ontimeupdate - _currentAudioEnd", _currentAudioEnd);
    // debug("ontimeupdate - currentAudioElement.currentTime", currentAudioElement.currentTime);
    if (_currentAudioEnd && currentAudioElement.currentTime >= (_currentAudioEnd - 0.05)
        ||
        !_currentAudioEnd && ev.type === "ended"
        // ev.type === "timeupdate"
        // currentAudioElement.currentTime >= currentAudioElement.duration
    ) {

        if (IS_DEV) {
            debug("ontimeupdate - mediaOverlaysNext()");
        }

        if (win.READIUM2.ttsAndMediaOverlaysManualPlayNext) {
            mediaOverlaysPause();

            // mediaOverlaysStop(true);
            // ==>
            // _mediaOverlayActive = stayActive ? true : false;
            // mediaOverlaysPause();
            // _mediaOverlayRoot = undefined;
            // _mediaOverlayTextAudioPair = undefined;
            // _mediaOverlayTextId = undefined;
        } else {
            mediaOverlaysNext();
        }
    }
};
const ensureOnTimeUpdate = (remove: boolean) => {
    if (_currentAudioElement) {
        if (remove) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((_currentAudioElement as any).__ontimeupdate) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (_currentAudioElement as any).__ontimeupdate = false;
                _currentAudioElement.removeEventListener("timeupdate", ontimeupdate);
                _currentAudioElement.removeEventListener("ended", ontimeupdate);
            }
        } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (!(_currentAudioElement as any).__ontimeupdate) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (_currentAudioElement as any).__ontimeupdate = true;
                _currentAudioElement.addEventListener("timeupdate", ontimeupdate);
                _currentAudioElement.addEventListener("ended", ontimeupdate);
            }
        }
    }
};

function ensureVideoFrameDraggable() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!_currentAudioElement || (_currentAudioElement as any).__draggable) {
        return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (_currentAudioElement as any).__draggable = true;

    let moveDiv: HTMLDivElement | undefined;

    let pos1 = 0;
    let pos2 = 0;
    let pos3 = 0;
    let pos4 = 0;
    let mouseDownX = 0;
    let mouseDownY = 0;

    if (document.pictureInPictureEnabled) {
        _currentAudioElement.addEventListener("enterpictureinpicture", async () => {
            if (!_currentAudioElement) {
                return;
            }
            _currentAudioElement.style.opacity = "0.2";
            _currentAudioElement.style.width = "1px";
            _currentAudioElement.style.height = "1px";
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (_currentAudioElement as any).__previousStyleTop = _currentAudioElement.style.top;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (_currentAudioElement as any).__previousStyleLeft = _currentAudioElement.style.left;
            _currentAudioElement.style.top = "0px";
            _currentAudioElement.style.left = "0px";
        });

        _currentAudioElement.addEventListener("leavepictureinpicture", async () => {
            if (!_currentAudioElement) {
                return;
            }
            _currentAudioElement.style.opacity = "1";
            _currentAudioElement.style.width = "auto";
            _currentAudioElement.style.height = "auto";
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((_currentAudioElement as any).__previousStyleTop) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                _currentAudioElement.style.top = (_currentAudioElement as any).__previousStyleTop;
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((_currentAudioElement as any).__previousStyleLeft) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                _currentAudioElement.style.left = (_currentAudioElement as any).__previousStyleLeft;
            }
        });

        // _currentAudioElement.addEventListener("click", async () => {
        // }, true);
    }

    _currentAudioElement.addEventListener("mousedown", elMouseDown);
    _currentAudioElement.addEventListener("mouseup", elMouseUp);

    async function elMouseUp(e: MouseEvent) {
            const _mouseDownX = mouseDownX;
            const _mouseDownY = mouseDownY;
            mouseDownX = 0;
            mouseDownY = 0;
            if (!_currentAudioElement) {
                docMouseUp();
                return;
            }
            e.preventDefault();
            e.stopPropagation();

            if (!_currentAudioElement || !document.pictureInPictureEnabled) {
                return;
            }

            // CLICK
            if (Math.abs(_mouseDownX - e.clientX) <= 4 && Math.abs(_mouseDownY - e.clientY) <= 4) {
                try {
                    if (_currentAudioElement !== document.pictureInPictureElement) {
                        await (_currentAudioElement as HTMLVideoElement).requestPictureInPicture();
                    } else {
                        await document.exitPictureInPicture();
                    }
                } catch (err) {
                    console.log("VIDEO PiP Error:", err);
                }
            }
    };

    function elMouseDown(e: MouseEvent) {
        if (!_currentAudioElement) {
            docMouseUp();
            return;
        }
        e.preventDefault();
        e.stopPropagation();

        mouseDownX = e.clientX;
        mouseDownY = e.clientY;

        pos3 = e.clientX;
        pos4 = e.clientY;

        if (moveDiv?.parentNode) {
            moveDiv.parentNode.removeChild(moveDiv);
            moveDiv = undefined;
        }
        moveDiv = document.createElement("div");
        moveDiv.setAttribute("style", "display: block; position: absolute; padding: 0; margin: 0; left: 0; top: 0; right: 0; bottom: 0; z-index: 9998; cursor: move; opacity: 0.4; background-color: black;");
        document.body.insertBefore(moveDiv, _currentAudioElement);

        document.body.addEventListener("mouseup", docMouseUp, true);
        document.body.addEventListener("mousemove", docMouseMove, true);
    }

    function docMouseMove(e: MouseEvent) {
        if (!_currentAudioElement) {
            docMouseUp();
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        _currentAudioElement.style.top = (_currentAudioElement.offsetTop - pos2) + "px";
        _currentAudioElement.style.left = (_currentAudioElement.offsetLeft - pos1) + "px";
    }

    function docMouseUp(e: MouseEvent | undefined = undefined) {
        if (e) {
            e.preventDefault();
            // e.stopPropagation();
        }
        if (moveDiv?.parentNode) {
            moveDiv.parentNode.removeChild(moveDiv);
            moveDiv = undefined;
        }
        document.body.removeEventListener("mouseup", docMouseUp, true);
        document.body.removeEventListener("mousemove", docMouseMove, true);
    }
}

async function playMediaOverlaysAudio(
    moTextAudioPair: MediaOverlayNode,
    begin: number | undefined,
    end: number | undefined) {

    if (IS_DEV) {
        debug("playMediaOverlaysAudio()", begin, end, moTextAudioPair.Audio, moTextAudioPair.AudioClipBegin, moTextAudioPair.AudioClipEnd);
    }

    ensureKillAutoNextTimeout();
    _mediaOverlayActive = true;

    _mediaOverlayTextAudioPair = moTextAudioPair;
    _mediaOverlayTextId = undefined;

    if (!moTextAudioPair.Audio && !moTextAudioPair.Video) {

        if (true || IS_DEV) {
            debug("playMediaOverlaysAudio - !moTextAudioPair.Audio => TTS()");
            debug(moTextAudioPair.Text);
            debug(moTextAudioPair.TextID);
        }

        // TTS
        moHighlight_(moTextAudioPair);
        return;
    }

    moHighlight_(moTextAudioPair);

    const publicationURL = win.READIUM2.publicationURL;
    // if (publicationURL.startsWith(READIUM2_ELECTRON_HTTP_PROTOCOL + "://")) {
    //     publicationURL = convertCustomSchemeToHttpUrl(publicationURL);
    // }

    // const url = publicationURL + "/../" + moTextAudioPair.Audio;
    const urlObjFull = new URL(moTextAudioPair.Audio || moTextAudioPair.Video, publicationURL);
    const urlFull = urlObjFull.toString();

    const urlObjNoQuery = new URL(urlFull);
    urlObjNoQuery.hash = "";
    urlObjNoQuery.search = "";
    const urlNoQuery = urlObjNoQuery.toString();

    const hasBegin = typeof begin !== "undefined";
    const hasEnd = typeof end !== "undefined";

    // _previousAudioBegin = _currentAudioBegin;
    _previousAudioEnd = _currentAudioEnd;

    _currentAudioBegin = undefined;
    _currentAudioEnd = undefined;

    if (!hasBegin && !hasEnd) {
        if (urlObjFull.hash) {
            const matches = urlObjFull.hash.match(/t=([0-9\.]+)(,([0-9\.]+))?/);
            // debug("playMediaOverlaysAudio() matches", matches?.length);
            if (matches && matches.length >= 1) {
                const b = matches[1];
                // debug("playMediaOverlaysAudio() begin", b);
                if (b) {
                    try {
                        _currentAudioBegin = parseFloat(b);
                    } catch (err) {
                        debug(err);
                    }
                }
                if (typeof _currentAudioBegin !== "undefined" && isNaN(_currentAudioBegin)) {
                    _currentAudioBegin = undefined;
                }
                if (matches.length >= 3) {
                    const e = matches[3];
                    // debug("playMediaOverlaysAudio() end", e);
                    if (e) {
                        try {
                            _currentAudioEnd = parseFloat(e);
                        } catch (err) {
                            debug(err);
                        }
                    }
                    if (typeof _currentAudioEnd !== "undefined" && isNaN(_currentAudioEnd)) {
                        _currentAudioEnd = undefined;
                    }
                }
            }
        }
    } else {
        // const mediaFragmentUrl = `${urlNoQuery}${`t=${hasBegin ? begin : ""}${hasEnd ? `,${end}` : ""}`}`;
        _currentAudioBegin = begin;
        _currentAudioEnd = end;
    }
    if (IS_DEV) {
        debug(`playMediaOverlaysAudio() ${urlFull} => [${_currentAudioBegin}-${_currentAudioEnd}]`);
    }

    const playClip = async (initial: boolean) => {
        if (!_currentAudioElement) {
            return;
        }

        const timeToSeekTo = _currentAudioBegin ? _currentAudioBegin : 0;

        if (initial || _currentAudioElement.paused) {
            if ((initial && !timeToSeekTo) ||
                _currentAudioElement.currentTime === timeToSeekTo) {

                if (IS_DEV) {
                    debug("playMediaOverlaysAudio() - playClip() - _currentAudioElement.play()");
                }
                ensureOnTimeUpdate(false);
                _currentAudioElement.playbackRate = _mediaOverlaysPlaybackRate;
                await _currentAudioElement.play();

                // mediaOverlaysStateSetMediaOverlaysStateEnum_.PLAYING);
            } else {
                if (IS_DEV) {
                    debug("playMediaOverlaysAudio() - playClip() - ontimeupdateSeeked");
                }
                const ontimeupdateSeeked = async (ev: Event) => {
                    const currentAudioElement = ev.currentTarget as HTMLAudioElement;
                    currentAudioElement.removeEventListener("timeupdate", ontimeupdateSeeked);

                    if (IS_DEV) {
                        debug("playMediaOverlaysAudio() - playClip() - ontimeupdateSeeked - .play()");
                    }
                    ensureOnTimeUpdate(false);
                    if (_currentAudioElement) {
                        _currentAudioElement.playbackRate = _mediaOverlaysPlaybackRate;
                        await _currentAudioElement.play();
                    }
                    // mediaOverlaysStateSet(MediaOverlaysStateEnum_.PLAYING);
                };
                _currentAudioElement.addEventListener("timeupdate", ontimeupdateSeeked);
                _currentAudioElement.currentTime = timeToSeekTo;
            }
        } else {
            const contiguous =
                _previousAudioUrl === _currentAudioUrl &&
                typeof _previousAudioEnd !== "undefined" &&
                _previousAudioEnd > (timeToSeekTo - 0.02) &&
                _previousAudioEnd <= timeToSeekTo &&
                _currentAudioElement.currentTime >= (timeToSeekTo - 0.1);
                // _currentAudioElement.currentTime <= (timeToSeekTo + 0.5)
            ensureOnTimeUpdate(false);
            if (contiguous) {
                if (IS_DEV) {
                    debug("playMediaOverlaysAudio() - playClip() - ensureOnTimeUpdate");
                }
            } else {
                if (IS_DEV) {
                    debug("playMediaOverlaysAudio() - playClip() - currentTime = timeToSeekTo");
                }
                _currentAudioElement.currentTime = timeToSeekTo;
            }
        }
    };

    _previousAudioUrl = _currentAudioUrl;
    if (!_currentAudioUrl || urlNoQuery !== _currentAudioUrl) {
        _currentAudioUrl = urlNoQuery;
        if (IS_DEV) {
            debug("playMediaOverlaysAudio() - RESET: " + _previousAudioUrl + " => " + _currentAudioUrl);
        }

        // _currentAudioElement = document.getElementById(AUDIO_MO_ID) as HTMLAudioElement;
        ensureOnTimeUpdate(true);
        if (_currentAudioElement) {
            _currentAudioElement.pause();
            _currentAudioElement.setAttribute("src", "");
            if (_currentAudioElement.parentNode) {
                _currentAudioElement.parentNode.removeChild(_currentAudioElement);
            }
        }
        _currentAudioElement = document.createElement(moTextAudioPair.Video ? "video" : "audio"); // no controls => should be invisible
        if (moTextAudioPair.Video) {
            _currentAudioElement.setAttribute("style", "display: block; position: absolute; padding: 0; margin: 0; left: 10px; top: 10px; width: auto; height: auto; z-index: 9999; cursor: move; border: 2px solid black;");
            // _currentAudioElement.setAttribute("controls", "true");
            _currentAudioElement.setAttribute("disableremoteplayback", "true");
            _currentAudioElement.setAttribute("controlsList", "nofullscreen nodownload noremoteplayback noplaybackrate");
            // _currentAudioElement.setAttribute("disablePictureInPicture", "false");
            ensureVideoFrameDraggable();
        } else {
            _currentAudioElement.setAttribute("style", "display: none");
        }
        _currentAudioElement.setAttribute("id", AUDIO_MO_ID);
        // _currentAudioElement.setAttribute("loop", "loop");
        // _currentAudioElement.setAttribute("autoplay", "autoplay");
        _currentAudioElement.setAttribute("role", "media-overlays");
        document.body.appendChild(_currentAudioElement);

        _currentAudioElement.addEventListener("error", (ev) => {
            debug("-1) error: " +
            (_currentAudioUrl !== (ev.currentTarget as HTMLAudioElement).src ? (_currentAudioUrl + " -- ") : "")
            + (ev.currentTarget as HTMLAudioElement).src.substr((ev.currentTarget as HTMLAudioElement).src.lastIndexOf("/")));

            if (_currentAudioElement && _currentAudioElement.error) {
                // 1 === MEDIA_ERR_ABORTED
                // 2 === MEDIA_ERR_NETWORK
                // 3 === MEDIA_ERR_DECODE
                // 4 === MEDIA_ERR_SRC_NOT_SUPPORTED
                debug(_currentAudioElement.error.code);
                debug(_currentAudioElement.error.message);
            }
        });

        if (IS_DEV) {
            _currentAudioElement.addEventListener("load", (ev) => {
                debug("0) load: " +
                (_currentAudioUrl !== (ev.currentTarget as HTMLAudioElement).src ? (_currentAudioUrl + " -- ") : "")
                + (ev.currentTarget as HTMLAudioElement).src.substr(
                    (ev.currentTarget as HTMLAudioElement).src.lastIndexOf("/")));
            });

            _currentAudioElement.addEventListener("loadstart", (ev) => {
                debug("1) loadstart: " +
                (_currentAudioUrl !== (ev.currentTarget as HTMLAudioElement).src ? (_currentAudioUrl + " -- ") : "")
                + (ev.currentTarget as HTMLAudioElement).src.substr(
                    (ev.currentTarget as HTMLAudioElement).src.lastIndexOf("/")));
            });

            _currentAudioElement.addEventListener("durationchange", (ev) => {
                debug("2) durationchange: " +
                (_currentAudioUrl !== (ev.currentTarget as HTMLAudioElement).src ? (_currentAudioUrl + " -- ") : "")
                + (ev.currentTarget as HTMLAudioElement).src.substr(
                    (ev.currentTarget as HTMLAudioElement).src.lastIndexOf("/")));
            });

            _currentAudioElement.addEventListener("loadedmetadata", (ev) => {
                debug("3) loadedmetadata: " +
                (_currentAudioUrl !== (ev.currentTarget as HTMLAudioElement).src ? (_currentAudioUrl + " -- ") : "")
                + (ev.currentTarget as HTMLAudioElement).src.substr(
                    (ev.currentTarget as HTMLAudioElement).src.lastIndexOf("/")));
            });

            _currentAudioElement.addEventListener("loadeddata", (ev) => {
                debug("4) loadeddata: " +
                (_currentAudioUrl !== (ev.currentTarget as HTMLAudioElement).src ? (_currentAudioUrl + " -- ") : "")
                + (ev.currentTarget as HTMLAudioElement).src.substr(
                    (ev.currentTarget as HTMLAudioElement).src.lastIndexOf("/")));
            });

            _currentAudioElement.addEventListener("progress", (ev) => {
                debug("5) progress: " +
                (_currentAudioUrl !== (ev.currentTarget as HTMLAudioElement).src ? (_currentAudioUrl + " -- ") : "")
                + (ev.currentTarget as HTMLAudioElement).src.substr(
                    (ev.currentTarget as HTMLAudioElement).src.lastIndexOf("/")));
            });

            _currentAudioElement.addEventListener("canplay", (ev) => {
                debug("6) canplay: " +
                (_currentAudioUrl !== (ev.currentTarget as HTMLAudioElement).src ? (_currentAudioUrl + " -- ") : "")
                + (ev.currentTarget as HTMLAudioElement).src.substr(
                    (ev.currentTarget as HTMLAudioElement).src.lastIndexOf("/")));
            });

            _currentAudioElement.addEventListener("canplaythrough", (ev) => {
                debug("7) canplaythrough: " +
                (_currentAudioUrl !== (ev.currentTarget as HTMLAudioElement).src ? (_currentAudioUrl + " -- ") : "")
                + (ev.currentTarget as HTMLAudioElement).src.substr(
                    (ev.currentTarget as HTMLAudioElement).src.lastIndexOf("/")));
            });

            _currentAudioElement.addEventListener("play", (ev) => {
                debug("8) play: " +
                (_currentAudioUrl !== (ev.currentTarget as HTMLAudioElement).src ? (_currentAudioUrl + " -- ") : "")
                + (ev.currentTarget as HTMLAudioElement).src.substr(
                    (ev.currentTarget as HTMLAudioElement).src.lastIndexOf("/")));
            });

            _currentAudioElement.addEventListener("pause", (ev) => {
                debug("9) pause: " +
                (_currentAudioUrl !== (ev.currentTarget as HTMLAudioElement).src ? (_currentAudioUrl + " -- ") : "")
                + (ev.currentTarget as HTMLAudioElement).src.substr(
                    (ev.currentTarget as HTMLAudioElement).src.lastIndexOf("/")));
            });

            _currentAudioElement.addEventListener("ended", (ev) => {
                debug("10) ended: " +
                (_currentAudioUrl !== (ev.currentTarget as HTMLAudioElement).src ? (_currentAudioUrl + " -- ") : "")
                + (ev.currentTarget as HTMLAudioElement).src.substr(
                    (ev.currentTarget as HTMLAudioElement).src.lastIndexOf("/")));
            });

            _currentAudioElement.addEventListener("seeked", (ev) => {
                debug("11) seeked: " +
                (_currentAudioUrl !== (ev.currentTarget as HTMLAudioElement).src ? (_currentAudioUrl + " -- ") : "")
                + (ev.currentTarget as HTMLAudioElement).src.substr(
                    (ev.currentTarget as HTMLAudioElement).src.lastIndexOf("/")));
            });

            if (DEBUG_AUDIO) {
                _currentAudioElement.addEventListener("timeupdate", (ev) => {
                    debug("12) timeupdate: " +
                    (_currentAudioUrl !== (ev.currentTarget as HTMLAudioElement).src ? (_currentAudioUrl + " -- ") : "")
                    + (ev.currentTarget as HTMLAudioElement).src.substr(
                        (ev.currentTarget as HTMLAudioElement).src.lastIndexOf("/")));
                });
            }

            _currentAudioElement.addEventListener("seeking", (ev) => {
                debug("13) seeking: " +
                (_currentAudioUrl !== (ev.currentTarget as HTMLAudioElement).src ? (_currentAudioUrl + " -- ") : "")
                + (ev.currentTarget as HTMLAudioElement).src.substr(
                    (ev.currentTarget as HTMLAudioElement).src.lastIndexOf("/")));
            });

            _currentAudioElement.addEventListener("waiting", (ev) => {
                debug("14) waiting: " +
                (_currentAudioUrl !== (ev.currentTarget as HTMLAudioElement).src ? (_currentAudioUrl + " -- ") : "")
                + (ev.currentTarget as HTMLAudioElement).src.substr(
                    (ev.currentTarget as HTMLAudioElement).src.lastIndexOf("/")));
            });

            _currentAudioElement.addEventListener("volumechange", (ev) => {
                debug("15) volumechange: " +
                (_currentAudioUrl !== (ev.currentTarget as HTMLAudioElement).src ? (_currentAudioUrl + " -- ") : "")
                + (ev.currentTarget as HTMLAudioElement).src.substr(
                    (ev.currentTarget as HTMLAudioElement).src.lastIndexOf("/")));
            });

            _currentAudioElement.addEventListener("suspend", (ev) => {
                debug("16) suspend: " +
                (_currentAudioUrl !== (ev.currentTarget as HTMLAudioElement).src ? (_currentAudioUrl + " -- ") : "")
                + (ev.currentTarget as HTMLAudioElement).src.substr(
                    (ev.currentTarget as HTMLAudioElement).src.lastIndexOf("/")));
            });

            _currentAudioElement.addEventListener("stalled", (ev) => {
                debug("17) stalled: " +
                (_currentAudioUrl !== (ev.currentTarget as HTMLAudioElement).src ? (_currentAudioUrl + " -- ") : "")
                + (ev.currentTarget as HTMLAudioElement).src.substr(
                    (ev.currentTarget as HTMLAudioElement).src.lastIndexOf("/")));
            });

            _currentAudioElement.addEventListener("ratechange", (ev) => {
                debug("18) ratechange: " +
                (_currentAudioUrl !== (ev.currentTarget as HTMLAudioElement).src ? (_currentAudioUrl + " -- ") : "")
                + (ev.currentTarget as HTMLAudioElement).src.substr(
                    (ev.currentTarget as HTMLAudioElement).src.lastIndexOf("/")));
            });

            _currentAudioElement.addEventListener("playing", (ev) => {
                debug("19) playing: " +
                (_currentAudioUrl !== (ev.currentTarget as HTMLAudioElement).src ? (_currentAudioUrl + " -- ") : "")
                + (ev.currentTarget as HTMLAudioElement).src.substr(
                    (ev.currentTarget as HTMLAudioElement).src.lastIndexOf("/")));
            });

            _currentAudioElement.addEventListener("interruptend", (ev) => {
                debug("20) interruptend: " +
                (_currentAudioUrl !== (ev.currentTarget as HTMLAudioElement).src ? (_currentAudioUrl + " -- ") : "")
                + (ev.currentTarget as HTMLAudioElement).src.substr(
                    (ev.currentTarget as HTMLAudioElement).src.lastIndexOf("/")));
            });

            _currentAudioElement.addEventListener("interruptbegin", (ev) => {
                debug("21) interruptbegin: " +
                (_currentAudioUrl !== (ev.currentTarget as HTMLAudioElement).src ? (_currentAudioUrl + " -- ") : "")
                + (ev.currentTarget as HTMLAudioElement).src.substr(
                    (ev.currentTarget as HTMLAudioElement).src.lastIndexOf("/")));
            });

            _currentAudioElement.addEventListener("emptied", (ev) => {
                debug("22) emptied: " +
                (_currentAudioUrl !== (ev.currentTarget as HTMLAudioElement).src ? (_currentAudioUrl + " -- ") : "")
                + (ev.currentTarget as HTMLAudioElement).src.substr(
                    (ev.currentTarget as HTMLAudioElement).src.lastIndexOf("/")));
            });

            _currentAudioElement.addEventListener("abort", (ev) => {
                debug("23) abort: " +
                (_currentAudioUrl !== (ev.currentTarget as HTMLAudioElement).src ? (_currentAudioUrl + " -- ") : "")
                + (ev.currentTarget as HTMLAudioElement).src.substr(
                    (ev.currentTarget as HTMLAudioElement).src.lastIndexOf("/")));
            });
        }

        const oncanplaythrough = async (ev: Event) => {
            const currentAudioElement = ev.currentTarget as HTMLAudioElement;
            currentAudioElement.removeEventListener("canplaythrough", oncanplaythrough);
            debug("oncanplaythrough");
            await playClip(true);
        };
        _currentAudioElement.addEventListener("canplaythrough", oncanplaythrough);

        const onpause = async (_ev: Event) => {
            debug("onpause");
            if (_mediaOverlaysState !== MediaOverlaysStateEnum_.PAUSED && _mediaOverlaysState !== MediaOverlaysStateEnum_.STOPPED) {
                mediaOverlaysStateSet(MediaOverlaysStateEnum_.PAUSED);
            }
        };
        _currentAudioElement.addEventListener("pause", onpause);

        const onplay = async (_ev: Event) => {
            debug("onplay");
            if (_mediaOverlaysState !== MediaOverlaysStateEnum_.PLAYING) {
                mediaOverlaysStateSet(MediaOverlaysStateEnum_.PLAYING);
            }
        };
        _currentAudioElement.addEventListener("play", onplay);

        _currentAudioElement.playbackRate = _mediaOverlaysPlaybackRate;
        _currentAudioElement.setAttribute("src", _currentAudioUrl);
    } else {
        if (IS_DEV) {
            debug("playMediaOverlaysAudio() - playClip()");
        }
        await playClip(false);
    }
}

// https://www.w3.org/TR/epub-33/#sec-behaviors-skip-escape
// https://www.w3.org/TR/epub-ssv-11/
const _skippables = [
    "footnote",
    "endnote",
    "pagebreak",
    //
    "note",
    "rearnote",
    "sidebar",
    "marginalia",
    "annotation",
    // "practice",
    // "help",
];
function isSkippable(mo: MediaOverlayNode): boolean {
    return mo.Role && mo.Role.findIndex((r) => {
        return _skippables.includes(r);
    }) >= 0;
}

// https://www.w3.org/TR/epub-33/#sec-escapability
// const _escapables = [
//     "table",
//     "table-row",
//     "table-cell",
//     "list",
//     "list-item",
//     "figure",
//     //
//     "footnote",
//     "endnote",
//     "note",
//     "rearnote",
//     "footnotes",
//     "rearnotes",
//     "sidebar",
//     "bibliography",
//     "toc",
//     "loi",
//     "appendix",
//     "landmarks",
//     "lot",
//     "index",
//     "colophon",
//     "epigraph",
//     "conclusion",
//     "afterword",
//     "warning",
//     "epilogue",
//     "foreword",
//     "introduction",
//     "prologue",
//     "preface",
//     "preamble",
//     "notice",
//     "errata",
//     "copyright-page",
//     "acknowledgments",
//     "other-credits",
//     "titlepage",
//     "imprimatur",
//     "contributors",
//     "halftitlepage",
//     "dedication",
//     "help",
//     "annotation",
//     "marginalia",
//     "practice",
//     "bridgehead",
//     "page-list",
//     "glossary",
// ];
// function isEscapable(mo: MediaOverlayNode): boolean {
//     return mo.Role && mo.Role.findIndex((r) => {
//         return _escapables.includes(r);
//     }) >= 0;
// }

function findNextTextAudioPair(
    mo: MediaOverlayNode,
    moToMatch: MediaOverlayNode,
    previousMo: {prev: MediaOverlayNode | undefined},
    escape: boolean):
    MediaOverlayNode | undefined | null { // returns null when skipped

    if (DEBUG_AUDIO) {
        debug("findNextTextAudioPair()");
        debug(JSON.stringify(moToMatch));
        debug(JSON.stringify(previousMo.prev));
    }
    const isSkip = _mediaOverlaySkippabilityIsEnabled && isSkippable(mo);
    if (isSkip) {
        if (DEBUG_AUDIO) {
            debug("findNextTextAudioPair() - isSkippable");
            debug(JSON.stringify(mo));
        }
        return null;
    }

    if (!mo.Children || !mo.Children.length) { // leaf === text/audio pair (SMIL par)
        if (DEBUG_AUDIO) {
            debug("findNextTextAudioPair() - leaf text/audio pair");
            debug(JSON.stringify(mo));
        }
        if (previousMo.prev === moToMatch
            // && (!escape || !isEscapable(mo))
            ) {

            if (DEBUG_AUDIO) {
                debug("findNextTextAudioPair() - prevMo === moToMatch");
            }
            return mo;
        }
        if (!_mediaOverlaySkippabilityIsEnabled || !isSkippable(mo)) {
            if (DEBUG_AUDIO) {
                debug("findNextTextAudioPair() - set previous");
                debug(JSON.stringify(mo));
            }
            previousMo.prev = mo;
        }
        return undefined;
    }
    for (const child of mo.Children) {
        if (DEBUG_AUDIO) {
            debug("findNextTextAudioPair() - child");
            debug(JSON.stringify(child));
        }
        const match = findNextTextAudioPair(child, moToMatch, previousMo, escape);
        if (match) {
            if (DEBUG_AUDIO) {
                debug("findNextTextAudioPair() - match");
                debug(JSON.stringify(match));
            }
            return match;
        }
    }
    return undefined;
}

function findPreviousTextAudioPair(
    mo: MediaOverlayNode,
    moToMatch: MediaOverlayNode,
    previousMo: {prev: MediaOverlayNode | undefined}):
    MediaOverlayNode | undefined | null { // returns null when skipped

    if (DEBUG_AUDIO) {
        debug("findPreviousTextAudioPair()");
        debug(JSON.stringify(moToMatch));
        debug(JSON.stringify(previousMo.prev));
    }
    const isSkip = _mediaOverlaySkippabilityIsEnabled && isSkippable(mo);
    if (isSkip) {
        if (DEBUG_AUDIO) {
            debug("findPreviousTextAudioPair() - isSkippable");
            debug(JSON.stringify(mo));
        }
        return null;
    }

    if (!mo.Children || !mo.Children.length) { // leaf === text/audio pair (SMIL par)
        if (DEBUG_AUDIO) {
            debug("findPreviousTextAudioPair() - leaf text/audio pair");
            debug(JSON.stringify(mo));
        }
        if (previousMo.prev &&
            mo === moToMatch
            ) {

            if (DEBUG_AUDIO) {
                debug("findPreviousTextAudioPair() - mo === moToMatch");
                debug(JSON.stringify(previousMo.prev));
            }
            return previousMo.prev;
        }
        if (!_mediaOverlaySkippabilityIsEnabled || !isSkippable(mo)) {
            if (DEBUG_AUDIO) {
                debug("findPreviousTextAudioPair() - set previous");
                debug(JSON.stringify(mo));
            }
            previousMo.prev = mo;
        }
        return undefined;
    }
    for (const child of mo.Children) {
        if (DEBUG_AUDIO) {
            debug("findPreviousTextAudioPair() - child");
            debug(JSON.stringify(child));
        }
        const match = findPreviousTextAudioPair(child, moToMatch, previousMo);
        if (match) {
            if (DEBUG_AUDIO) {
                debug("findPreviousTextAudioPair() - match");
                debug(JSON.stringify(match));
            }
            return match;
        }
    }
    return undefined;
}

function findDepthFirstTextAudioPair(
    textHref: string,
    mo: MediaOverlayNode,
    textFragmentIDChain: Array<string> | undefined | null,
    allowFallbackSeek: boolean):
    MediaOverlayNode | undefined | null { // returns null when skipped

    if (DEBUG_AUDIO) {
        debug("findDepthFirstTextAudioPair()", textFragmentIDChain);
    }
    const isSkip = _mediaOverlaySkippabilityIsEnabled && isSkippable(mo);

    let isTextUrlMatch: boolean | undefined;
    let isFragmentIDMatch: boolean | undefined;
    if (mo.Text) {
        const hrefUrlObj = new URL("https://dummy.com/" + mo.Text);
        if (hrefUrlObj.pathname.substr(1) === textHref) { // includes leading slash
            isTextUrlMatch = true;

            if (hrefUrlObj.hash && textFragmentIDChain) {
                isFragmentIDMatch = false;
                const id = hrefUrlObj.hash.substr(1); // includes #
                for (const frag of textFragmentIDChain) {
                    if (frag === id) {
                        isFragmentIDMatch = true;
                        break;
                    }
                }
            }
        } else {
            isTextUrlMatch = false;
        }
    }

    if (DEBUG_AUDIO) {
        debug("isSkip: " + isSkip);
        debug("isFragmentIDMatch: " + isFragmentIDMatch);
        debug("isTextUrlMatch: " + isTextUrlMatch);
    }
    const hasChildren = mo.Children?.length;
    if (!hasChildren) { // leaf === text/audio pair (SMIL par)
        if (DEBUG_AUDIO) {
            debug("findDepthFirstTextAudioPair() - leaf text/audio pair", isFragmentIDMatch, isTextUrlMatch, textFragmentIDChain);
        }
        if (!isTextUrlMatch) {
            if (DEBUG_AUDIO) {
                debug("findDepthFirstTextAudioPair() - leaf - !isTextUrlMatch");
            }
            return undefined;
        }
        if (isFragmentIDMatch ||
            (isTextUrlMatch && textFragmentIDChain === undefined) // excludes null which is for root call only
        ) {
            if (isSkip) {
                if (DEBUG_AUDIO) {
                    debug("findDepthFirstTextAudioPair() - leaf - isFragmentIDMatch || (isTextUrlMatch && !textFragmentIDChain (isSkip)");
                }
                return null;
            } else {
                if (DEBUG_AUDIO) {
                    debug("findDepthFirstTextAudioPair() - leaf - isFragmentIDMatch || (isTextUrlMatch && !textFragmentIDChain");
                }
                return mo;
            }
        }
        return undefined;
    }
    const textFragmentIDChainOriginal = textFragmentIDChain;
    let frags = textFragmentIDChain;
    for (const child of mo.Children) {
        if (DEBUG_AUDIO) {
            debug("findDepthFirstTextAudioPair() - child");
            debug(JSON.stringify(child));
        }
        const match = findDepthFirstTextAudioPair(textHref, child, frags, allowFallbackSeek);
        if (match === null) { // match, but skipped ... let's ignore the fragment IDs and just pick the next
            if (DEBUG_AUDIO) {
                debug("findDepthFirstTextAudioPair() - child - match null (skip)");
            }
            frags = undefined;
        }
        if (match) {
            if (DEBUG_AUDIO) {
                debug("findDepthFirstTextAudioPair() - child - match");
                debug(JSON.stringify(match));
            }
            return match;
        }
    }
    if (allowFallbackSeek && isFragmentIDMatch) {
        if (isSkip) {
            if (DEBUG_AUDIO) {
                debug("findDepthFirstTextAudioPair() - post isFragmentIDMatch (skip)");
            }
            return null;
        } else {
            if (DEBUG_AUDIO) {
                debug("findDepthFirstTextAudioPair() - post isFragmentIDMatch");
            }
            const match = findDepthFirstTextAudioPair(textHref, mo, undefined, false);
            if (match) {
                if (DEBUG_AUDIO) {
                    debug("findDepthFirstTextAudioPair() - post isFragmentIDMatch - match");
                    debug(JSON.stringify(match));
                }
                return match;
            } else {
                return match; // null for skipped, or undefined otherwise
            }
        }
    }
    if (textFragmentIDChainOriginal && !frags) {
        // was found, but skippable
        return null;
    }
    return undefined;
}

let _timeoutAutoNext: number | undefined;
function ensureKillAutoNextTimeout() {
    if (_timeoutAutoNext) {
        clearTimeout(_timeoutAutoNext);
        _timeoutAutoNext = undefined;
    }
}
async function playMediaOverlaysForLink(link: Link, textFragmentIDChain: Array<string | null> | undefined, isInteract: boolean) {

    if (IS_DEV) {
        debug("playMediaOverlaysForLink()");
        debug(link.Href);
        debug(link.HrefDecoded);
        debug(JSON.stringify(textFragmentIDChain, null, 4));
    }
    let moUrl: string | undefined;
    if (link.Properties?.MediaOverlay) {
        moUrl = link.Properties.MediaOverlay;
        if (IS_DEV) {
            debug(link.Properties.MediaOverlay);
            debug(link.Duration);
        }
    }
    if (link.Alternate) {
        for (const altLink of link.Alternate) {
            if (altLink.TypeLink === "application/vnd.syncnarr+json") {
                if (!moUrl) {
                    moUrl = altLink.Href; // HrefDecoded corrupts the query param! media-overlay.json?href=PATH
                }
                if (IS_DEV) {
                    debug(altLink.Href);
                    debug(altLink.HrefDecoded);
                    debug(altLink.TypeLink);
                    debug(altLink.Duration);
                }
            }
        }
    }

    ensureKillAutoNextTimeout();

    if (!moUrl) {
        if (IS_DEV) {
            debug("playMediaOverlaysForLink() - navLeftOrRight()");
        }
        _timeoutAutoNext = win.setTimeout(() => {
            _timeoutAutoNext = undefined;

            mediaOverlaysStop(true);
            // metadata-level RTL
            // const rtl = isRTL_PackageMeta();
            // navLeftOrRight(rtl, true, true);
            navPreviousOrNext(false, true, true);
        }, 600); // was 2 seconds, but transition too slow (user thinks playback is stalled)

        mediaOverlaysStateSet(MediaOverlaysStateEnum_.PLAYING);
        return;
    }
    // typically undefined at first, because serialized JSON not init'ed, lazy-loaded
    if (!link.MediaOverlays || !link.MediaOverlays.initialized) {

        const publicationURL = win.READIUM2.publicationURL;
        // if (publicationURL.startsWith(READIUM2_ELECTRON_HTTP_PROTOCOL + "://")) {
        //     publicationURL = convertCustomSchemeToHttpUrl(publicationURL);
        // }

        // const moUrlFull = publicationURL + "/../" + moUrl;
        const moUrlObjFull = new URL(moUrl, publicationURL);
        const moUrlFull = moUrlObjFull.toString();

        let response: Response;
        try {
            response = await fetch(moUrlFull);
        } catch (e) {
            debug(e);
            debug(moUrlFull);
            return;
        }
        if (!response.ok) {
            debug("BAD RESPONSE?!");
        }
        // response.headers.forEach((arg0: any, arg1: any) => {
        //     debug(arg0 + " => " + arg1);
        // });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let moJson: any | undefined;
        try {
            moJson = await response.json();
        } catch (e) {
            debug(e);
        }
        if (!moJson) {
            return;
        }

        link.MediaOverlays = TaJsonDeserialize<MediaOverlayNode>(moJson, MediaOverlayNode);
        // link.MediaOverlays.SmilPathInZip = smilFilePath;
        link.MediaOverlays.initialized = true;

        if (IS_DEV) {
            // debug(JSON.stringify(link.MediaOverlays, null, 4));
            debug(util.inspect(link.MediaOverlays,
                { showHidden: false, depth: 1000, colors: true, customInspect: true }));
        }
    }
    if (!link.MediaOverlays || !link.MediaOverlays.initialized) {
        debug("Has MO but no Media Overlays?! " + link.Href);
        if (IS_DEV) {
            debug(JSON.stringify(win.READIUM2.publication, null, 4));
            debug(util.inspect(win.READIUM2.publication,
                { showHidden: false, depth: 1000, colors: true, customInspect: true }));
        }
        return;
    }

    if (IS_DEV) {
        debug("playMediaOverlaysForLink() - playMediaOverlays()");
    }
    const href = link.HrefDecoded || link.Href;
    const hrefUrlObj = new URL("https://dummy.com/" + href);
    // hrefUrlObj.hash = "";
    // hrefUrlObj.search = "";
    await playMediaOverlays(hrefUrlObj.pathname.substr(1), link.MediaOverlays, textFragmentIDChain, isInteract);
}

let _lastClickedNotification: {
    locationHashOverrideInfo: IEventPayload_R2_EVENT_READING_LOCATION | undefined;
    textFragmentIDChain: Array<string | null> | undefined;
    link: Link | undefined;
} | undefined;
export function mediaOverlaysHandleIpcMessage(
    eventChannel: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    eventArgs: any[],
    eventCurrentTarget: IReadiumElectronWebview): boolean {

    const activeWebView = eventCurrentTarget;

    if (eventChannel === R2_EVENT_MEDIA_OVERLAY_CLICK) {
        // debug("R2_EVENT_MEDIA_OVERLAY_CLICK (webview.addEventListener('ipc-message')");
        if (publicationHasMediaOverlays(win.READIUM2.publication)
            // &&
            // (
            // // win.READIUM2.mediaOverlaysClickEnabled &&
            // _mediaOverlayRoot
            // )
        ) {
            if (IS_DEV) {
                debug("R2_EVENT_MEDIA_OVERLAY_CLICK");
            }

            const payload = eventArgs[0] as IEventPayload_R2_EVENT_MEDIA_OVERLAY_CLICK;

            // if (!payload.userInteract) {
            //     let linkFirst: Link | undefined;
            //     let linkSecond: Link | undefined;
            //     const firstWebView = win.READIUM2.getFirstWebView();
            //     if (firstWebView) {
            //         linkFirst = firstWebView.READIUM2.link;
            //     }
            //     const secondWebView = win.READIUM2.getSecondWebView(false);
            //     if (secondWebView) {
            //         linkSecond = secondWebView.READIUM2.link;
            //     }
            //     if (linkFirst && linkSecond && win.READIUM2.publication.Spine) {
            //         const indexFirst = win.READIUM2.publication.Spine.indexOf(linkFirst);
            //         const indexSecond = win.READIUM2.publication.Spine.indexOf(linkSecond);
            //         if (indexSecond >= 0 && indexFirst >= 0) {
            //             const firstLink = indexSecond < indexFirst ? linkSecond : linkFirst;
            //             if (activeWebView.READIUM2.link?.Href &&
            //                 activeWebView.READIUM2.link?.Href !== firstLink.Href) {
            //                 debug(`R2_EVENT_MEDIA_OVERLAY_CLICK skipped spread
            //                 ${activeWebView.READIUM2.link?.Href}`);
            //                 return true;
            //             }
            //         }
            //     }
            // }

            const wasPlaying = _mediaOverlaysState === MediaOverlaysStateEnum_.PLAYING;
            const lastClickedNotification = _lastClickedNotification;

            mediaOverlaysInterrupt();

            _lastClickedNotification = {
                link: activeWebView.READIUM2.link,
                textFragmentIDChain: payload.textFragmentIDChain,
                locationHashOverrideInfo: payload.locationHashOverrideInfo,
            };

            if ((payload.userInteract && _mediaOverlaysClickEnabled) ||
                _mediaOverlayActive) {

                if (IS_DEV) {
                    debug("playMediaOverlaysForLink");
                }
                setTimeout(async () => {
                    if (activeWebView.READIUM2.link) {
                        await playMediaOverlaysForLink(activeWebView.READIUM2.link, payload.textFragmentIDChain, payload.userInteract);
                        if (_mediaOverlaysState !== MediaOverlaysStateEnum_.PLAYING) {
                            _lastClickedNotification = lastClickedNotification;
                            if (wasPlaying) {
                                mediaOverlaysResume();
                            }
                        }
                    }
                }, 0);
            } else {
                _lastClickedNotification = lastClickedNotification;
            }
        }
    } else if (eventChannel === R2_EVENT_MEDIA_OVERLAY_STARTSTOP) {
        const payload = eventArgs[0] as IEventPayload_R2_EVENT_MEDIA_OVERLAY_STARTSTOP;

        if (IS_DEV) {
            debug("R2_EVENT_MEDIA_OVERLAY_STARTSTOP");
        }
        mediaOverlaysStop();

        if (payload.start) {
            const rate = _mediaOverlaysPlaybackRate;
            mediaOverlaysPlay(1); // iBooks
            _mediaOverlaysPlaybackRate = rate;
        } else if (payload.stop) {
            //
        } else {
            if (_currentAudioElement && !_currentAudioElement.paused) {
                //
            } else {
                const rate = _mediaOverlaysPlaybackRate;
                mediaOverlaysPlay(1); // iBooks
                _mediaOverlaysPlaybackRate = rate;
            }
        }
    } else {
        return false;
    }
    return true;
}
function moHighlight_(moTextAudioPair: MediaOverlayNode) {
    if (IS_DEV) {
        debug("moHighlight ...");
    }
    if (moTextAudioPair.Text) {
        const i = moTextAudioPair.Text.lastIndexOf("#");
        if (i >= 0) {
            const id = moTextAudioPair.Text.substr(i + 1);
            if (id) {
                _mediaOverlayTextId = id;
                _mediaOverlayTextHref = moTextAudioPair.Text.substr(0, i);

                const speak = !moTextAudioPair.Audio && !moTextAudioPair.Video;
                if (speak) {
                    if (_currentAudioElement) {
                        _currentAudioElement.pause();
                    }
                }
                const speech = (speak && _mediaOverlayTextHref && _mediaOverlayTextId) ? `${_mediaOverlayTextHref}#${_mediaOverlayTextId}` : undefined;
                moHighlight(_mediaOverlayTextHref, _mediaOverlayTextId, speech);
            }
        }
    }
}

let __eventIDCounter = 0;

function moHighlight(href: string | undefined, id: string | undefined, speech?: string) {
    if (IS_DEV) {
        debug("moHighlight: " + href + " ## " + id + " (( SPEECH? )) " + speech);
    }

    const classActive = win.READIUM2.publication.Metadata?.MediaOverlay?.ActiveClass;
    const classActivePlayback =
        win.READIUM2.publication.Metadata?.MediaOverlay?.PlaybackActiveClass;
    const payloadPing: IEventPayload_R2_EVENT_MEDIA_OVERLAY_HIGHLIGHT = {
        captionsMode: _captionsMode,
        useTTSHighlights: win.READIUM2.mediaOverlaysUseTTSHighlights, // _useTTSHighlights,
        classActive: classActive ? classActive : undefined,
        classActivePlayback: classActivePlayback ? classActivePlayback : undefined,
        id,
        speech,
        speechRate: _mediaOverlaysPlaybackRate,
    };
    const activeWebViews = win.READIUM2.getActiveWebViews();
    for (const activeWebView of activeWebViews) {

        if (href && activeWebView.READIUM2.link?.Href !== href) {
            continue;
        }

        if (href) {
            if (id) {
                // const loc = getCurrentReadingLocation();
                // loc?.followingElementIDs
                _lastClickedNotification = {
                    link: activeWebView.READIUM2.link,
                    textFragmentIDChain: [id],
                    locationHashOverrideInfo: undefined,
                };
            } else {
                _lastClickedNotification = undefined;
            }
        }
        setTimeout(async () => {
            if (activeWebView.READIUM2?.DOMisReady) {

                if (__eventIDCounter >= Number.MAX_SAFE_INTEGER) {
                    __eventIDCounter = 0;
                }
                const eventID = __eventIDCounter++;

                if (speech) {
                    const cb = (event: Electron.IpcMessageEvent) => {
                        if (event.channel === R2_EVENT_MEDIA_OVERLAY_HIGHLIGHT) {
                            const webview = event.currentTarget as IReadiumElectronWebview;
                            if (webview !== activeWebView) {
                                console.log("Wrong webview for _currentTTSSpeech?!");
                                return;
                            }

                            const payloadPong = event.args[0] as IEventPayload_R2_EVENT_MEDIA_OVERLAY_HIGHLIGHT;
                            if ((event.args[1] as number) !== eventID) {
                                return;
                            }

                            if (!payloadPong?.speech || payloadPong.speech !== speech) {
                                // console.log("Incorrect webview _currentTTSSpeech payload?!");
                                // console.log(speech, JSON.stringify(payloadBack, null, 4));
                                return;
                            }

                            try {
                                activeWebView.removeEventListener("ipc-message", cb);
                            } catch (_err) {
                                // noop
                            }

                            if (!payloadPong.id) {
                                // console.log("Cancelled webview _currentTTSSpeech payload.");
                                // console.log(JSON.stringify(payloadBack, null, 4));
                                return;
                            }

                            if (win.READIUM2.ttsAndMediaOverlaysManualPlayNext) {
                                mediaOverlaysPause();
                            } else {
                                mediaOverlaysNext();
                            }
                        }
                    };
                    activeWebView.addEventListener("ipc-message", cb);
                }

                await activeWebView.send(R2_EVENT_MEDIA_OVERLAY_HIGHLIGHT, payloadPing, eventID);
            }
        }, 0);
    }
}

let _mediaOverlaysState = MediaOverlaysStateEnum_.STOPPED;
const mediaOverlaysStateSet = (mediaOverlaysState: MediaOverlaysStateEnum_) => {
    _mediaOverlaysState = mediaOverlaysState;
    debug("mediaOverlaysStateSet", mediaOverlaysState);

    const payload: IEventPayload_R2_EVENT_MEDIA_OVERLAY_STATE = {
        state: mediaOverlaysState,
    };
    const activeWebViews = win.READIUM2.getActiveWebViews();
    for (const activeWebView of activeWebViews) {
        setTimeout(async () => {
            if (activeWebView.READIUM2?.DOMisReady) {
                await activeWebView.send(R2_EVENT_MEDIA_OVERLAY_STATE, payload);
            }
        }, 0);
    }

    if (_mediaOverlaysListener) {
        _mediaOverlaysListener(mediaOverlaysState);
    }
};

let _mediaOverlaysListener: ((mediaOverlaysState: MediaOverlaysStateEnum_) => void) | undefined;
export function mediaOverlaysListen(mediaOverlaysListener: (mediaOverlaysState: MediaOverlaysStateEnum_) => void) {
    _mediaOverlaysListener = mediaOverlaysListener;
}

export function mediaOverlaysPlay(speed: number) {
    if (IS_DEV) {
        debug("mediaOverlaysPlay()");
    }
    if (!win.READIUM2 || !win.READIUM2.publication) {
        return;
    }

    _mediaOverlaysPlaybackRate = speed;

    if (!_mediaOverlayRoot || !_mediaOverlayTextAudioPair || (!_mediaOverlayTextAudioPair.Audio && !_mediaOverlayTextAudioPair.Video)) {
        if (IS_DEV) {
            debug("mediaOverlaysPlay() - playMediaOverlaysForLink()");
        }
        let textFragmentIDChain: Array<string | null> | undefined;
        const href = _lastClickedNotification?.link?.Href;
        let activeWebView = win.READIUM2.getActiveWebViews().find((webview) => {
            return href && webview.READIUM2.link?.Href === href;
        });
        if (activeWebView) {
            textFragmentIDChain = _lastClickedNotification?.textFragmentIDChain;
        } else {
            activeWebView = win.READIUM2.getFirstWebView();
        }
        setTimeout(async () => {
            if (activeWebView && activeWebView.READIUM2.link) {
                await playMediaOverlaysForLink(activeWebView.READIUM2.link, textFragmentIDChain, false);
            }
        }, 0);
    } else {
        if (IS_DEV) {
            debug("mediaOverlaysPlay() - mediaOverlaysResume()");
        }
        mediaOverlaysResume();
    }
}

export function mediaOverlaysPause() {
    if (IS_DEV) {
        debug("mediaOverlaysPause()");
    }
    if (!win.READIUM2 || !win.READIUM2.publication) {
        return;
    }

    moHighlight(undefined, undefined);

    ensureOnTimeUpdate(true);
    if (_currentAudioElement) {
        _currentAudioElement.pause();
    }

    mediaOverlaysStateSet(MediaOverlaysStateEnum_.PAUSED);
}

export function mediaOverlaysInterrupt() {
    if (!win.READIUM2 || !win.READIUM2.publication) {
        return;
    }
    if (!publicationHasMediaOverlays(win.READIUM2.publication)) {
        return;
    }
    if (IS_DEV) {
        debug("mediaOverlaysInterrupt()");
    }
    mediaOverlaysStop(_mediaOverlayActive);
}
export function mediaOverlaysStop(stayActive?: boolean) {
    if (IS_DEV) {
        debug("mediaOverlaysStop() stayActive: " + stayActive);
    }
    if (!win.READIUM2 || !win.READIUM2.publication) {
        return;
    }

    _mediaOverlayActive = stayActive ? true : false;

    mediaOverlaysPause();

    _mediaOverlayRoot = undefined;
    _mediaOverlayTextAudioPair = undefined;
    _mediaOverlayTextId = undefined;

    if (!_mediaOverlayActive) {
        _lastClickedNotification = undefined;
        mediaOverlaysStateSet(MediaOverlaysStateEnum_.STOPPED);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (_currentAudioElement && (_currentAudioElement as any).__draggable) {

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (_currentAudioElement as any).__hidden = true;
            _currentAudioElement.style.display = "none";

            if (document.pictureInPictureEnabled) {
                if (_currentAudioElement === document.pictureInPictureElement) {
                    setTimeout(async () =>{
                        try {
                            await document.exitPictureInPicture();
                        } catch (err) {
                            console.log("VIDEO PiP Error:", err);
                        }
                    }, 100);
                }
            }
        }
        // if (_currentAudioElement) {
        //     ensureOnTimeUpdate(true);
        //     // _currentAudioElement.pause();
        //     _currentAudioElement.setAttribute("src", "");
        //     if (_currentAudioElement.parentNode) {
        //         _currentAudioElement.parentNode.removeChild(_currentAudioElement);
        //     }
        //     _currentAudioElement = undefined;
        // }
    }
}

export function mediaOverlaysResume() {
    if (IS_DEV) {
        debug("mediaOverlaysResume()");
    }
    if (!win.READIUM2 || !win.READIUM2.publication) {
        return;
    }

    if (_mediaOverlayRoot && _mediaOverlayTextAudioPair && (_mediaOverlayTextAudioPair.Audio || _mediaOverlayTextAudioPair.Video)) {
        if (IS_DEV) {
            debug("mediaOverlaysResume() - _currentAudioElement.play()");
        }
        ensureOnTimeUpdate(false);
        if (_currentAudioElement) {
            if (_currentAudioEnd && _currentAudioElement.currentTime >= (_currentAudioEnd - 0.05)) {

                if (IS_DEV) {
                    debug("mediaOverlaysResume --- ontimeupdate - mediaOverlaysNext()");
                }

                mediaOverlaysNext();
                return;
            }

            setTimeout(async () => {
                if (_currentAudioElement) {
                    _currentAudioElement.playbackRate = _mediaOverlaysPlaybackRate;
                    await _currentAudioElement.play();
                }
            }, 0);
        }
        mediaOverlaysStateSet(MediaOverlaysStateEnum_.PLAYING);
        moHighlight_(_mediaOverlayTextAudioPair);
    } else {
        if (IS_DEV) {
            debug("mediaOverlaysResume() - mediaOverlaysPlay()");
        }
        mediaOverlaysPlay(_mediaOverlaysPlaybackRate);
    }
}

export function mediaOverlaysPrevious() {
    if (IS_DEV) {
        debug("mediaOverlaysPrevious()");
    }
    if (!win.READIUM2 || !win.READIUM2.publication) {
        return;
    }
    // (currentAudioElement as any).__ontimeupdate = false;
    // currentAudioElement.removeEventListener("timeupdate", ontimeupdate);
    ensureOnTimeUpdate(true);

    if (_mediaOverlayRoot && _mediaOverlayTextAudioPair) {
        const previousTextAudioPair =
            findPreviousTextAudioPair(_mediaOverlayRoot, _mediaOverlayTextAudioPair, {prev: undefined});
        if (!previousTextAudioPair) {
            if (IS_DEV) {
                debug("mediaOverlaysPrevious() - navLeftOrRight()");
            }
            mediaOverlaysStop(true);
            // metadata-level RTL
            // const rtl = isRTL_PackageMeta();
            // navLeftOrRight(!rtl, true, true);
            navPreviousOrNext(true, true, true);
        } else {
            let switchDoc = false;
            if (_mediaOverlayTextAudioPair.Text && previousTextAudioPair.Text) {
                const hrefUrlObj1 = new URL("https://dummy.com/" + _mediaOverlayTextAudioPair.Text);
                const hrefUrlObj2 = new URL("https://dummy.com/" + previousTextAudioPair.Text);
                if (hrefUrlObj1.pathname !== hrefUrlObj2.pathname) { // includes leading slash
                    if (IS_DEV) {
                        debug("mediaOverlaysPrevious SWITCH! " + hrefUrlObj1.pathname + " != " + hrefUrlObj2.pathname);
                    }
                    switchDoc = true;
                }
            }
            if (switchDoc) {
                mediaOverlaysStop(true);

                const publicationURL = win.READIUM2.publicationURL;
                // if (publicationURL.startsWith(READIUM2_ELECTRON_HTTP_PROTOCOL + "://")) {
                //     publicationURL = convertCustomSchemeToHttpUrl(publicationURL);
                // }

                // const url = publicationURL + "/../" + previousTextAudioPair.Text;
                const urlObjFull = new URL(previousTextAudioPair.Text, publicationURL);
                const urlFull = urlObjFull.toString();
                if (IS_DEV) {
                    debug("mediaOverlaysPrevious() - handleLinkUrl()");
                }
                const activeWebView = win.READIUM2.getFirstOrSecondWebView();
                handleLinkUrl(
                    urlFull,
                    activeWebView ? activeWebView.READIUM2.readiumCss : undefined);
            } else {
                if (IS_DEV) {
                    debug("mediaOverlaysPrevious() - playMediaOverlaysAudio()");
                }
                setTimeout(async () => {
                    await playMediaOverlaysAudio(previousTextAudioPair, undefined, undefined);
                }, 0);

                mediaOverlaysStateSet(MediaOverlaysStateEnum_.PLAYING);
            }
        }
    } else {
        if (IS_DEV) {
            debug("mediaOverlaysPrevious() - navLeftOrRight() 2");
        }
        mediaOverlaysStop(true);
        // metadata-level RTL
        // const rtl = isRTL_PackageMeta();
        // navLeftOrRight(!rtl, true, true);
        navPreviousOrNext(true, true, true);
        // if (IS_DEV) {
        //     debug("mediaOverlaysPrevious() - mediaOverlaysPlay()");
        // }
        // mediaOverlaysPlay(_mediaOverlaysPlaybackRate);
    }
}

export function mediaOverlaysNext(escape?: boolean) {
    if (IS_DEV) {
        debug("mediaOverlaysNext()");
    }
    if (!win.READIUM2 || !win.READIUM2.publication) {
        return;
    }
    // (currentAudioElement as any).__ontimeupdate = false;
    // currentAudioElement.removeEventListener("timeupdate", ontimeupdate);
    ensureOnTimeUpdate(true);

    if (_mediaOverlayRoot && _mediaOverlayTextAudioPair) {
        const nextTextAudioPair =
            findNextTextAudioPair(_mediaOverlayRoot, _mediaOverlayTextAudioPair, {prev: undefined},
                escape ? true : false);
        if (!nextTextAudioPair) {
            if (IS_DEV) {
                debug("mediaOverlaysNext() - navLeftOrRight()");
            }
            mediaOverlaysStop(true);
            // metadata-level RTL
            // const rtl = isRTL_PackageMeta();
            // navLeftOrRight(rtl, true, true);
            navPreviousOrNext(false, true, true);
        } else {
            let switchDoc = false;
            if (_mediaOverlayTextAudioPair.Text && nextTextAudioPair.Text) {
                const hrefUrlObj1 = new URL("https://dummy.com/" + _mediaOverlayTextAudioPair.Text);
                const hrefUrlObj2 = new URL("https://dummy.com/" + nextTextAudioPair.Text);
                if (hrefUrlObj1.pathname !== hrefUrlObj2.pathname) { // includes leading slash
                    if (IS_DEV) {
                        debug("mediaOverlaysNext() SWITCH! " + hrefUrlObj1.pathname + " != " + hrefUrlObj2.pathname);
                    }
                    switchDoc = true;
                }
            }
            if (switchDoc) {
                mediaOverlaysStop(true);

                const publicationURL = win.READIUM2.publicationURL;
                // if (publicationURL.startsWith(READIUM2_ELECTRON_HTTP_PROTOCOL + "://")) {
                //     publicationURL = convertCustomSchemeToHttpUrl(publicationURL);
                // }

                // const url = publicationURL + "/../" + nextTextAudioPair.Text;
                const urlObjFull = new URL(nextTextAudioPair.Text, publicationURL);
                const urlFull = urlObjFull.toString();
                if (IS_DEV) {
                    debug("mediaOverlaysNext() - handleLinkUrl()");
                }
                const activeWebView = win.READIUM2.getFirstOrSecondWebView();
                handleLinkUrl(
                    urlFull,
                    activeWebView ? activeWebView.READIUM2.readiumCss : undefined);
            } else {
                if (IS_DEV) {
                    debug("mediaOverlaysNext() - playMediaOverlaysAudio()");
                }
                setTimeout(async () => {
                    await playMediaOverlaysAudio(nextTextAudioPair, undefined, undefined);
                }, 0);

                mediaOverlaysStateSet(MediaOverlaysStateEnum_.PLAYING);
            }
        }
    } else {
        if (IS_DEV) {
            debug("mediaOverlaysNext() - navLeftOrRight() 2");
        }
        mediaOverlaysStop(true);
        // metadata-level RTL
        // const rtl = isRTL_PackageMeta();
        // navLeftOrRight(rtl, true, true);
        navPreviousOrNext(false, true, true);
        // if (IS_DEV) {
        //     debug("mediaOverlaysNext() - mediaOverlaysPlay()");
        // }
        // mediaOverlaysPlay(_mediaOverlaysPlaybackRate);
    }
}

export function mediaOverlaysEscape() {
    if (!win.READIUM2 || !win.READIUM2.publication) {
        return;
    }
    mediaOverlaysNext(true);
}

export function mediaOverlaysUseTTSHighlights(useTTSHighlights: boolean) {
    if (!win.READIUM2) {
        return;
    }
    win.READIUM2.mediaOverlaysUseTTSHighlights = useTTSHighlights;
    // _useTTSHighlights = useTTSHighlights;

    // if (IS_DEV) {
    //     debug("mediaOverlaysEnableCaptionsMode() - mediaOverlaysPause() + mediaOverlaysPlay()");
    // }
    // mediaOverlaysPause();
    // setTimeout(() => {
    //     mediaOverlaysPlay(_mediaOverlaysPlaybackRate);
    // }, 300);
}

export function mediaOverlaysEnableCaptionsMode(captionsMode: boolean) {
    _captionsMode = captionsMode;

    // if (IS_DEV) {
    //     debug("mediaOverlaysEnableCaptionsMode() - mediaOverlaysPause() + mediaOverlaysPlay()");
    // }
    // mediaOverlaysPause();
    // setTimeout(() => {
    //     mediaOverlaysPlay(_mediaOverlaysPlaybackRate);
    // }, 300);
}

export function mediaOverlaysClickEnable(doEnable: boolean) {
    _mediaOverlaysClickEnabled = doEnable;
    // if (win.READIUM2) {
    //     win.READIUM2.mediaOverlaysClickEnabled = doEnable;
    // }

    // const activeWebViews = win.READIUM2.getActiveWebViews();

    // if (!activeWebView) {
    //     return;
    // }

    // const payload: IEventPayload_R2_EVENT_MEDIA_OVERLAYS_CLICK_ENABLE = {
    //     doEnable,
    // };

    // setTimeout(async () => {
    // if (activeWebView.READIUM2?.DOMisReady) {
    //     await activeWebView.send(R2_EVENT_MEDIA_OVERLAYS_CLICK_ENABLE, payload);
    // }, 0);
}

export function mediaOverlaysPlaybackRate(speed: number) {
    if (!win.READIUM2 || !win.READIUM2.publication) {
        return;
    }

    _mediaOverlaysPlaybackRate = speed;

    if (_currentAudioElement) {
        _currentAudioElement.playbackRate = speed;
    }
}

let _mediaOverlaySkippabilityIsEnabled = true;
export function mediaOverlaysEnableSkippability(doEnable: boolean) {
    _mediaOverlaySkippabilityIsEnabled = doEnable;
}
