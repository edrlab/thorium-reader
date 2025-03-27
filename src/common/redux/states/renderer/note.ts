// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { HighlightDrawTypeBackground, HighlightDrawTypeMarginBookmark, HighlightDrawTypeOutline, HighlightDrawTypeStrikethrough, HighlightDrawTypeUnderline, IColor } from "@r2-navigator-js/electron/common/highlight";
import { hexToRgb } from "readium-desktop/common/rgb";
import { TTranslatorKeyParameter } from "readium-desktop/typings/en.translation-keys";
import { MiniLocatorExtended } from "../locatorInitialState";
import { INoteCreator } from "../creator";
import { IReadiumAnnotation } from "readium-desktop/common/readium/annotation/annotationModel.type";

// DO NOT REMOVE THIS COMMENT BLOCK (USED FOR TRANSLATOR KEYS DETECTION DURING CODE SCANNING)
// __("reader.notes.colors.red")
// __("reader.notes.colors.orange")
// __("reader.notes.colors.yellow")
// __("reader.notes.colors.green")
// __xxx("reader.notes.colors.bluegreen") // ===> "bluegreen" translation becomes unused!
// __xxx("reader.notes.colors.lightblue") // ===> "lightblue" translation becomes unused!
// __("reader.notes.colors.cyan")
// __("reader.notes.colors.purple")


export const NOTE_PINK_COLOR = "#EB9694";
export const NOTE_ORANGE_COLOR = "#FAD0C3";
export const NOTE_YELLOW_COLOR = "#FEF3BD";
export const NOTE_GREEN_COLOR = "#C1EAC5";
export const NOTE_BLUE_COLOR = "#BED3F3";
export const NOTE_PURPLE_COLOR = "#D4C4FB";

// https://github.com/readium/notes/blob/main/README.md#14-body
export const noteColorCodeToColorTranslatorKeySet: Record<string, TTranslatorKeyParameter> = {
    [NOTE_PINK_COLOR]: "reader.annotations.colors.red", // "pink"
    [NOTE_ORANGE_COLOR]: "reader.annotations.colors.orange", // "orange"
    [NOTE_YELLOW_COLOR]: "reader.annotations.colors.yellow", // "yellow"
    [NOTE_GREEN_COLOR]: "reader.annotations.colors.green", // "green"
    // "#BEDADC": "reader.annotations.colors.bluegreen", // ===> "bluegreen" translation becomes unused!
    // "#C4DEF6": "reader.annotations.colors.lightblue", // ===> "lightblue" translation becomes unused!
    [NOTE_BLUE_COLOR]: "reader.annotations.colors.cyan", // "blue"
    [NOTE_PURPLE_COLOR]: "reader.annotations.colors.purple", // "purple"
};

export const noteColorCodeToColorSet: Record<string, TNoteColorSet> = {
    [NOTE_PINK_COLOR]: "pink",
    [NOTE_ORANGE_COLOR]: "orange",
    [NOTE_YELLOW_COLOR]: "yellow",
    [NOTE_GREEN_COLOR]: "green",
    [NOTE_BLUE_COLOR]: "blue",
    [NOTE_PURPLE_COLOR]: "purple",
};
export const noteColorSetToColorCode: Record<string, string> = {
    "pink": NOTE_PINK_COLOR,
    "orange": NOTE_ORANGE_COLOR,
    "yellow": NOTE_YELLOW_COLOR,
    "green": NOTE_GREEN_COLOR,
    "blue": NOTE_BLUE_COLOR,
    "purple": NOTE_PURPLE_COLOR,
};

export type TNoteColorSet = "pink" | "orange" | "yellow" | "green" | "blue" | "purple";
export const NOTE_DEFAULT_COLOR: TNoteColorSet = "yellow";
export const NOTE_DEFAULT_COLOR_OBJ: IColor = hexToRgb(noteColorSetToColorCode[NOTE_DEFAULT_COLOR]);

// export type TDrawType = "solid_background" | "underline" | "strikethrough" | "outline" | "bookmark";
export const convertDrawTypeToNumber = (drawType: EDrawType): number => {
    return Number(drawType) || 0;
};

export type TDrawType = "solid_background" | "underline" | "strikethrough" | "outline" | "bookmark";
export const noteDrawType: TDrawType[] = [
    "solid_background",
    "underline",
    "strikethrough",
    "outline",
];
export enum EDrawType {
    "solid_background" = HighlightDrawTypeBackground,
    "underline" = HighlightDrawTypeUnderline,
    "strikethrough" = HighlightDrawTypeStrikethrough,
    "outline" = HighlightDrawTypeOutline,
    // "opacity_mask" = HighlightDrawTypeOpacityMask,
    // "opacity_mask_ruler" = HighlightDrawTypeOpacityMaskRuler,
    "bookmark" = HighlightDrawTypeMarginBookmark,
}

export interface INoteState {
    uuid: string;
    index: number;
    locatorExtended: MiniLocatorExtended;
    textualValue?: string;
    color: IColor;
    drawType: EDrawType;
    tags?: string[];
    modified?: number;
    created: number;
    creator?: INoteCreator;
    group: "bookmark" | "annotation";
}

export type TDrawView = "annotation" | "margin" | "hide";

export type TnoteTagsIndex = Record<string, number>;

export type INotePreParsingState = Pick<INoteState, "uuid" | "textualValue" | "color" | "drawType" | "tags" | "modified" | "created" | "creator"> & { target: IReadiumAnnotation["target"] };
