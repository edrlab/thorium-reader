// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export type TtsLookAheadBoundary =
    | "none"
    | "sentence"
    | "paragraph"
    | "list-item"
    | "heading-to-body"
    | "section"
    | "document";

export type TtsLookAheadBlockKind =
    | "heading"
    | "paragraph"
    | "list-item"
    | "blockquote"
    | "caption"
    | "table-cell"
    | "code"
    | "math"
    | "image-description"
    | "page-break"
    | "other";

export type TtsLookAheadDirection = "ltr" | "rtl" | "auto";

export interface ITtsLookAheadBlock {
    id: string;
    kind: TtsLookAheadBlockKind;
    htmlTag?: string;
    headingLevel?: number;
    epubTypes?: string[];
    ariaRole?: string;
}

export interface ITtsLookAheadPosition {
    indexInBlock: number;
    firstInBlock: boolean;
    lastInBlock: boolean;
}

export interface ITtsLookAheadUnit {
    sequence: number;
    text: string;
    lang?: string;
    direction?: TtsLookAheadDirection;
    block: ITtsLookAheadBlock;
    position: ITtsLookAheadPosition;
    boundaryBefore: TtsLookAheadBoundary;
    boundaryAfter: TtsLookAheadBoundary;
}

export interface ITtsLookAheadSource {
    rate: number;
    voiceName?: string;
    voiceURI?: string;
    lang?: string;
}

export interface ITtsLookAheadSnapshot {
    generation: number;
    revision: number;
    currentSequence: number;
    source: ITtsLookAheadSource;
    units: ITtsLookAheadUnit[];
}
