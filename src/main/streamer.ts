// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import * as path from "path";

import {
    colCountEnum,
    IReadiumCSS,
    readiumCSSDefaults,
    textAlignEnum,
} from "@r2-navigator-js/electron/common/readium-css-settings";
import {
    _NODE_MODULE_RELATIVE_URL,
    _PACKAGING,
} from "readium-desktop/preprocessor-directives";

import { IEventPayload_R2_EVENT_READIUMCSS } from "@r2-navigator-js/electron/common/events";
import { Link } from "@r2-shared-js/models/publication-link";

import { Publication } from "@r2-shared-js/models/publication";

import { Server } from "@r2-streamer-js/http/server";
import { Store } from "redux";

import { app } from "electron";
import { container } from "readium-desktop/main/di";

import { secureSessions } from "@r2-navigator-js/electron/main/sessions";

import { setupReadiumCSS } from "@r2-navigator-js/electron/main/readium-css";

const debug = debug_("readium-desktop:main#streamer");

// Create readium2 streamer
// This streamer is used to stream epub content to the renderer
export const streamer: Server = new Server({
    disableDecryption: false,
    disableOPDS: true,
    disableReaders: true,
    disableRemotePubUrl: true,
});

app.on("ready", () => {
    secureSessions(streamer); // HTTPS
});

let rcssPath = "ReadiumCSS";
if (_PACKAGING === "1") {
    rcssPath = path.normalize(path.join(__dirname, rcssPath));
} else {
    rcssPath = "r2-navigator-js/dist/ReadiumCSS";
    rcssPath = path.normalize(path.join(__dirname, _NODE_MODULE_RELATIVE_URL, rcssPath));
}

rcssPath = rcssPath.replace(/\\/g, "/");
debug("readium css path:", rcssPath);

// TODO: centralize this code, currently duplicated
// see src/renderer/components/reader/ReaderApp.jsx
function computeReadiumCssJsonMessage(publication: Publication, link: Link | undefined):
    IEventPayload_R2_EVENT_READIUMCSS {
    const store = (container.get("store") as Store<any>);
    let settings = store.getState().reader.config;
    if (!settings.value) {
        debug("!settings.value? (MAIN)");
    } else {
        settings = settings.value;
    }
    debug(settings);

    // TODO: see the readiumCSSDefaults values below, replace with readium-desktop's own
    const cssJson: IReadiumCSS = {

        a11yNormalize: readiumCSSDefaults.a11yNormalize,

        backgroundColor: readiumCSSDefaults.backgroundColor,

        bodyHyphens: readiumCSSDefaults.bodyHyphens,

        colCount: settings.colCount === "1" ? colCountEnum.one :
            (settings.colCount === "2" ? colCountEnum.two : colCountEnum.auto),

        darken: settings.dark,

        font: settings.font,

        fontSize: settings.fontSize,

        invert: settings.invert,

        letterSpacing: settings.letterSpacing,

        ligatures: readiumCSSDefaults.ligatures,

        lineHeight: settings.lineHeight,

        night: settings.night,

        pageMargins: settings.pageMargins,

        paged: settings.paged,

        paraIndent: readiumCSSDefaults.paraIndent,

        paraSpacing: settings.paraSpacing,

        sepia: settings.sepia,

        noFootnotes: settings.noFootnotes,

        textAlign: settings.align === "left" ? textAlignEnum.left :
            (settings.align === "right" ? textAlignEnum.right :
            (settings.align === "justify" ? textAlignEnum.justify : textAlignEnum.start)),

        textColor: readiumCSSDefaults.textColor,

        typeScale: readiumCSSDefaults.typeScale,

        wordSpacing: settings.wordSpacing,

        reduceMotion: readiumCSSDefaults.reduceMotion,
    };
    const jsonMsg: IEventPayload_R2_EVENT_READIUMCSS = { setCSS: cssJson };
    console.log("jsonMsg MAIN");
    console.log(jsonMsg);
    return jsonMsg;
}

setupReadiumCSS(streamer, rcssPath, computeReadiumCssJsonMessage);
