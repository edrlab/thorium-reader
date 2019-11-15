// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { BrowserWindow } from "electron";

import { textAlignEnum } from "@r2-navigator-js/electron/common/readium-css-settings";

import { Identifiable } from "./identifiable";

export enum ReaderMode {
    Attached = "attached",
    Detached = "detached",
}

/**
 *  A reader
 */
export interface Reader extends Identifiable {
    filesystemPath: string;
    manifestUrl: string;
    publicationIdentifier: string;
    window: BrowserWindow;
}

/**
 * A reader configuration
 */
export interface ReaderConfig {
    [key: string]: any; // TODO any?!
    identifier?: string;
    align: textAlignEnum.justify | textAlignEnum.left | textAlignEnum.right | textAlignEnum.start | "auto";
    colCount: string;
    dark: false;
    font: string;
    fontSize: string;
    invert: boolean;
    lineHeight: string;
    night: boolean;
    paged: boolean;
    readiumcss: boolean;
    sepia: boolean;
    enableMathJax: boolean;
}

export interface BookmarkCollection {
    [key: string]: Bookmark;
}

export interface Bookmark extends Identifiable {
    identifiable: Identifiable;
    docHref: string;
    docSelector: string;
}
