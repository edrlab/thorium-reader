// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import {
    IEventPayload_R2_EVENT_HIGHLIGHT_CLICK, IEventPayload_R2_EVENT_HIGHLIGHT_CREATE,
    IEventPayload_R2_EVENT_HIGHLIGHT_REMOVE, IEventPayload_R2_EVENT_HIGHLIGHT_REMOVE_ALL, R2_EVENT_HIGHLIGHT_CLICK, R2_EVENT_HIGHLIGHT_CREATE,
    R2_EVENT_HIGHLIGHT_REMOVE, R2_EVENT_HIGHLIGHT_REMOVE_ALL,
    IEventPayload_R2_EVENT_HIGHLIGHT_DRAW_MARGIN, R2_EVENT_HIGHLIGHT_DRAW_MARGIN,
} from "../common/events";
import { IHighlight, IHighlightDefinition } from "../common/highlight";
import { ReadiumElectronBrowserWindow, IReadiumElectronWebview } from "./webview/state";

// import debug_ from "debug";
// const debug = debug_("r2:navigator#electron/renderer/index");
// const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");

const win = global.window as ReadiumElectronBrowserWindow;

export function highlightsHandleIpcMessage(
    eventChannel: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    eventArgs: any[],
    eventCurrentTarget: IReadiumElectronWebview): boolean {

    if (eventChannel === R2_EVENT_HIGHLIGHT_CLICK) {
        const activeWebView = eventCurrentTarget;
        const payload = eventArgs[0] as IEventPayload_R2_EVENT_HIGHLIGHT_CLICK;
        if (_highlightsClickListener && activeWebView.READIUM2.link) {
            _highlightsClickListener(activeWebView.READIUM2.link.Href, payload.highlight, payload.event);
        }
        return true;
    } else if (eventChannel === R2_EVENT_HIGHLIGHT_CREATE) {
        return true;
    } else {
        return false;
    }
}

let _highlightsClickListener: ((href: string, highlight: IHighlight, event?: IEventPayload_R2_EVENT_HIGHLIGHT_CLICK["event"]) => void) | undefined;
export function highlightsClickListen(highlightsClickListener: (href: string, highlight: IHighlight, event?: IEventPayload_R2_EVENT_HIGHLIGHT_CLICK["event"]) => void) {
    _highlightsClickListener = highlightsClickListener;
}
export function highlightsRemoveAll(href: string, groups: string[] | undefined) {
    console.log("--HIGH-- highlightsRemoveAll: " + href + " ... " + JSON.stringify(groups));
    const activeWebViews = win.READIUM2.getActiveWebViews();
    for (const activeWebView of activeWebViews) {
        if (activeWebView.READIUM2.link?.Href !== href) {
            continue;
        }

        setTimeout(async () => {
            if (activeWebView.READIUM2?.DOMisReady) {

                const payload: IEventPayload_R2_EVENT_HIGHLIGHT_REMOVE_ALL = {
                    groups,
                };
                if (groups) {
                    if (activeWebView.READIUM2.highlights) {
                        activeWebView.READIUM2.highlights =  activeWebView.READIUM2.highlights.filter((h) => {
                            return !h.group || !groups.includes(h.group);
                        });
                    }
                } else {
                    activeWebView.READIUM2.highlights = undefined;
                }
                await activeWebView.send(R2_EVENT_HIGHLIGHT_REMOVE_ALL, payload);
            }
        }, 0);
    }
}
export function highlightsRemove(href: string, highlightIDs: string[]) {
    console.log("--HIGH-- highlightsRemove: " + href + " ==> " + highlightIDs.length);
    const activeWebViews = win.READIUM2.getActiveWebViews();
    for (const activeWebView of activeWebViews) {
        if (activeWebView.READIUM2.link?.Href !== href) {
            continue;
        }

        const payload: IEventPayload_R2_EVENT_HIGHLIGHT_REMOVE = {
            highlightIDs,
        };
        setTimeout(async () => {
            if (activeWebView.READIUM2?.DOMisReady) {
                if (activeWebView.READIUM2.highlights) {
                    activeWebView.READIUM2.highlights = activeWebView.READIUM2.highlights.filter((h) => {
                        return !highlightIDs.includes(h.id);
                    });
                }
                await activeWebView.send(R2_EVENT_HIGHLIGHT_REMOVE, payload);
            }
        }, 0);
    }
}

let __eventIDCounter = 0;

export async function highlightsCreate(
    href: string,
    highlightDefinitions: IHighlightDefinition[] | undefined):
    Promise<Array<IHighlight | null>> {
    return new Promise<Array<IHighlight | null>>((resolve, reject) => {
        console.log("--HIGH-- highlightsCreate: " + href + " ==> " + highlightDefinitions?.length);
        const activeWebViews = win.READIUM2.getActiveWebViews();
        for (const activeWebView of activeWebViews) {
            if (activeWebView.READIUM2.link?.Href !== href) {
                continue;
            }

            if (__eventIDCounter >= Number.MAX_SAFE_INTEGER) {
                __eventIDCounter = 0;
            }
            const eventID = __eventIDCounter++;

            const cb = (event: Electron.IpcMessageEvent) => {
                if (event.channel === R2_EVENT_HIGHLIGHT_CREATE) {
                    const webview = event.currentTarget as IReadiumElectronWebview;
                    if (webview !== activeWebView) {
                        console.log("Wrong navigator webview?!");
                        return;
                    }
                    const payloadPong = event.args[0] as IEventPayload_R2_EVENT_HIGHLIGHT_CREATE;
                    if ((event.args[1] as number) === eventID) {
                        webview.removeEventListener("ipc-message", cb);
                        if (!payloadPong.highlights) { // includes undefined and empty array
                            // UNCHANGED webview.READIUM2.highlights = undefined;
                            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                            reject("highlightCreate fail?!");
                        } else {
                            if (!webview.READIUM2.highlights) {
                                webview.READIUM2.highlights = [];
                            }
                            webview.READIUM2.highlights.push(...(payloadPong.highlights.filter((h) => !!h) as IHighlight[]));
                            resolve(payloadPong.highlights);
                        }
                    }
                }
            };
            activeWebView.addEventListener("ipc-message", cb);
            const payloadPing: IEventPayload_R2_EVENT_HIGHLIGHT_CREATE = {
                highlightDefinitions,
                highlights: undefined,
            };

            setTimeout(async () => {
                if (activeWebView.READIUM2?.DOMisReady) {
                    await activeWebView.send(R2_EVENT_HIGHLIGHT_CREATE, payloadPing, eventID);
                }
            }, 0);

            return;
        }

        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        reject("highlightsCreate - no webview match?!");
    });
}

export function highlightsDrawMargin(drawMargin: boolean | string[]) {
    console.log("--HIGH-- highlightsDrawMargin: " + JSON.stringify(drawMargin, null, 4));
    win.READIUM2.highlightsDrawMargin = drawMargin;
    const activeWebViews = win.READIUM2.getActiveWebViews();
    for (const activeWebView of activeWebViews) {
        const payload: IEventPayload_R2_EVENT_HIGHLIGHT_DRAW_MARGIN = {
            drawMargin,
        };
        setTimeout(async () => {
            if (activeWebView.READIUM2?.DOMisReady) {
                await activeWebView.send(R2_EVENT_HIGHLIGHT_DRAW_MARGIN, payload);
            }
        }, 0);
    }
}
