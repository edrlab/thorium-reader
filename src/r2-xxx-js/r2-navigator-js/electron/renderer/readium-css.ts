// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Link } from "@r2-shared-js/models/publication-link";

import { IEventPayload_R2_EVENT_READIUMCSS } from "../common/events";
import { ReadiumElectronBrowserWindow, IReadiumElectronWebview } from "./webview/state";

const win = global.window as ReadiumElectronBrowserWindow;

const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");

export function isRTL_PackageMeta(/* link: Link | undefined */): boolean {
    // if (link && link.Properties) {
    //     if (link.Properties.Direction === "rtl") {
    //         return true;
    //     }
    //     if (typeof link.Properties.Direction !== "undefined") {
    //         return false;
    //     }
    // }

    const publication = win.READIUM2.publication;

    if (publication &&
        publication.Metadata &&
        publication.Metadata.Direction) {
        return publication.Metadata.Direction.toLowerCase() === "rtl"; //  any other value is LTR
    }
    return false;
}

export function isFixedLayout(link: Link | undefined): boolean {
    if (link && link.Properties) {
        if (link.Properties.Layout === "fixed") {
            return true;
        }
        if (typeof link.Properties.Layout !== "undefined") {
            return false;
        }
    }

    const publication = win.READIUM2.publication;

    if (publication &&
        publication.Metadata &&
        publication.Metadata.Rendition) {
        return publication.Metadata.Rendition.Layout === "fixed";
    }
    return false;
}

const _defaultReadiumCss: IEventPayload_R2_EVENT_READIUMCSS = { setCSS: undefined, isFixedLayout: false };

export function obtainReadiumCss(rcss?: IEventPayload_R2_EVENT_READIUMCSS) {
    const r = rcss ? rcss :
        (_computeReadiumCssJsonMessage ? _computeReadiumCssJsonMessage() :
            _defaultReadiumCss);
    if (IS_DEV) {
        console.log(`ReadiumCSS obtain: ${rcss ? "provided" : (_computeReadiumCssJsonMessage ? "pulled" : "default")}`);
        console.log(r);
    }
    return r;
}

export function adjustReadiumCssJsonMessageForFixedLayout(
    webview: IReadiumElectronWebview | undefined,
    pubLink: Link | undefined,
    rcss: IEventPayload_R2_EVENT_READIUMCSS,
): IEventPayload_R2_EVENT_READIUMCSS {

    if (!webview) {
        return rcss;
    }

    if (isFixedLayout(pubLink)) {

        return {
            fixedLayoutWebViewHeight: webview.clientHeight,
            fixedLayoutWebViewWidth: webview.clientWidth,
            fixedLayoutZoomPercent: win.READIUM2.fixedLayoutZoomPercent,
            isFixedLayout: true,
            setCSS: undefined,
        };
    }

    return rcss;
}

let _computeReadiumCssJsonMessage: (() => IEventPayload_R2_EVENT_READIUMCSS) | undefined;
// = () => {
//     return _defaultReadiumCss;
// };
export function setReadiumCssJsonGetter(func: () => IEventPayload_R2_EVENT_READIUMCSS) {
    _computeReadiumCssJsonMessage = func;
}
