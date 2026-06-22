// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export interface IColor {
    red: number;
    green: number;
    blue: number;
}

export interface TPdfAnnotationRectTransport {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export interface TPdfAnnotationDraftTransport {
    type: "pdf-text-highlight";
    page: number;
    rects: TPdfAnnotationRectTransport[];
    quote?: string;
}

export type TPdfAnnotationSelectionErrorReason =
    | "empty"
    | "no-usable-rects"
    | "multi-page"
    | "missing-page"
    | "missing-viewport"
    | "invalid-rects";

export interface TPdfAnnotationSelectionErrorPayload {
    source: "highlight:create-from-selection" | "instant-selection";
    reason: TPdfAnnotationSelectionErrorReason;
}

export type TPdfAnnotationCreateSource = "highlight:create-from-selection" | "instant-selection";

export type TPdfAnnotationDrawType = "solid_background" | "underline" | "strikethrough" | "outline";

export interface TPdfAnnotationTransport extends TPdfAnnotationDraftTransport {
    id: string;
    color: IColor;
    drawType: TPdfAnnotationDrawType;
}

export interface TPdfAnnotationNavigationTarget {
    id: string;
    page: number;
    rect: TPdfAnnotationRectTransport;
}

export interface TPdfAnnotationSelectionTarget {
    id: string;
    page: number;
    rectIndex: number;
    rect: TPdfAnnotationRectTransport;
    source: "overlay-click";
    shiftKey: boolean;
    altKey: boolean;
    ctrlKey: boolean;
    metaKey: boolean;
}
