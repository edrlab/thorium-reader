// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export const TTS_LOOK_AHEAD_CHANNEL = "tts-look-ahead";

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

export interface IVoiceLinkBlock {
    id: string;
    kind: TtsLookAheadBlockKind;
    htmlTag?: string;
    headingLevel?: number;
    epubTypes?: string[];
    ariaRole?: string;
}

export interface IVoiceLinkPosition {
    indexInBlock: number;
    firstInBlock: boolean;
    lastInBlock: boolean;
}

export interface IVoiceLinkUnit {
    sequence: number;
    text: string;
    lang?: string;
    direction?: TtsLookAheadDirection;
    block: IVoiceLinkBlock;
    position: IVoiceLinkPosition;
    boundaryBefore: TtsLookAheadBoundary;
    boundaryAfter: TtsLookAheadBoundary;
}

export interface IVoiceLinkSource {
    rate: number;
    voiceName?: string;
    voiceURI?: string;
    lang?: string;
}

export interface IVoiceLinkSynthesisHint {
    route: string;
    voice: string;
    speed: number;
    format: string;
}

export interface IVoiceLinkSnapshot {
    protocol: 1;
    generation: number;
    revision: number;
    currentSequence: number;
    source: IVoiceLinkSource;
    synthesisHint?: IVoiceLinkSynthesisHint;
    units: IVoiceLinkUnit[];
}

export interface IVoiceLinkCapabilities {
    protocols: number[];
    maxUnits: number;
    maxCharacters: number;
    maxUnitCharacters: number;
    maxBodyBytes: number;
}

export interface ITtsLookAheadSnapshotMessage {
    type: "snapshot";
    streamId: string;
    snapshot: IVoiceLinkSnapshot;
}

export interface ITtsLookAheadStopMessage {
    type: "stop";
    streamId: string;
    snapshot?: never;
}

export type ITtsLookAheadMessage = ITtsLookAheadSnapshotMessage | ITtsLookAheadStopMessage;
