// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ISelectionInfo } from "./selection";

export interface IColor {
    red: number;
    green: number;
    blue: number;
}

export const HighlightDrawTypeNONE = -1;
export const HighlightDrawTypeBackground = 0;
export const HighlightDrawTypeUnderline = 1;
export const HighlightDrawTypeStrikethrough = 2;
export const HighlightDrawTypeOutline = 3;
export const HighlightDrawTypeOpacityMask = 4;
export const HighlightDrawTypeOpacityMaskRuler = 5;
export const HighlightDrawTypeMarginBookmark = 6;

export interface IHighlight {
    id: string;
    selectionInfo?: ISelectionInfo;
    range?: Range;
    rangeCssHighlight?: Range;
    // rangeHasSVG?: boolean;
    color: IColor;
    pointerInteraction: boolean;

    // 0 is full background (default), 1 is underline, 2 is strikethrough
    drawType?: number;

    expand?: number;

    group: string | undefined;

    marginText?: string;

    textPopup?: ITextPopup;
}

export interface ITextPopup {
    text: string;
    dir?: "ltr" | "rtl";
    lang?: string;
}
export interface IHighlightDefinition {
    selectionInfo: ISelectionInfo | undefined;
    range?: Range;

    color: IColor | undefined;

    // 0 is full background (default), 1 is underline, 2 is strikethrough
    drawType?: number;

    expand?: number;

    group: string | undefined;

    marginText?: string;

    textPopup?: ITextPopup;
}

export function convertColorHexadecimalToRGBA(cssHex: string, alpha?: number): string | undefined {
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(cssHex)) {
        const hex = cssHex.substring(1);
        const hex_ = hex.length === 3 ?
            `0x${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}` :
            `0x${hex[0]}${hex[1]}${hex[2]}${hex[3]}${hex[4]}${hex[5]}`;
        const hexVal = parseInt(hex_, 16);
        // tslint:disable-next-line: no-bitwise
        return `rgb${alpha ? "a" : ""}(${(hexVal >> 16) & 255}, ${(hexVal >> 8) & 255}, ${hexVal & 255}${alpha ? `, ${alpha}` : ""})`;
    }
    return undefined;
}
