// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { BrowserWindow } from "electron";

import { Identifiable } from "./identifiable";
import { Publication } from "./publication";

export enum ReaderMode {
    Attached = "attached",
    Detached = "detached"
}

/**
 *  A reader
 */
export interface Reader extends Identifiable {
    filesystemPath: string;
    manifestUrl: string;
    publication: Publication;
    window: BrowserWindow;
}

/**
 * A reader configuration
 */
export interface ReaderConfig {
    [key: string]: any;
    identifier?: string;
    align: "center"|"left"|"right";
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
}

export interface BookmarkCollection {
    [key: string]: Bookmark;
}

export interface Bookmark {
    identifier: string;
    publication: Identifiable;
    docHref: string;
    docSelector: string;
}
