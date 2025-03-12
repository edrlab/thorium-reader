// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { MiniLocatorExtended } from "readium-desktop/common/redux/states/locatorInitialState";

import { IPQueueState } from "readium-desktop/utils/redux-reducers/pqueue.reducer";
import { IAnnotationCreator } from "../creator";
import { IReadiumAnnotation } from "readium-desktop/common/readium/annotation/annotationModel.type";
import { TTranslatorKeyParameter } from "readium-desktop/typings/en.translation-keys";

// DO NOT REMOVE THIS COMMENT BLOCK (USED FOR TRANSLATOR KEYS DETECTION DURING CODE SCANNING)
// __("reader.annotations.colors.red")
// __("reader.annotations.colors.orange")
// __("reader.annotations.colors.yellow")
// __("reader.annotations.colors.green")
// __xxx("reader.annotations.colors.bluegreen") // ===> "bluegreen" translation becomes unused!
// __xxx("reader.annotations.colors.lightblue") // ===> "lightblue" translation becomes unused!
// __("reader.annotations.colors.cyan")
// __("reader.annotations.colors.purple")

export type TAnnotationColorSet = "pink" | "orange" | "yellow" | "green" | "blue" | "purple";
export const ANNOTATION_DEFAULT_COLOR: TAnnotationColorSet = "yellow";

export const ANNOTATION_PINK_COLOR = "#EB9694";
export const ANNOTATION_ORANGE_COLOR = "#FAD0C3";
export const ANNOTATION_YELLOW_COLOR = "#FEF3BD";
export const ANNOTATION_GREEN_COLOR = "#C1EAC5";
export const ANNOTATION_BLUE_COLOR = "#BED3F3";
export const ANNOTATION_PURPLE_COLOR = "#D4C4FB";

// https://github.com/readium/annotations/blob/main/README.md#14-body
export const annotationsColorsLight: Record<string, TTranslatorKeyParameter> = {
    [ANNOTATION_PINK_COLOR]: "reader.annotations.colors.red", // "pink"
    [ANNOTATION_ORANGE_COLOR]: "reader.annotations.colors.orange", // "orange"
    [ANNOTATION_YELLOW_COLOR]: "reader.annotations.colors.yellow", // "yellow"
    [ANNOTATION_GREEN_COLOR]: "reader.annotations.colors.green", // "green"
    // "#BEDADC": "reader.annotations.colors.bluegreen", // ===> "bluegreen" translation becomes unused!
    // "#C4DEF6": "reader.annotations.colors.lightblue", // ===> "lightblue" translation becomes unused!
    [ANNOTATION_BLUE_COLOR]: "reader.annotations.colors.cyan", // "blue"
    [ANNOTATION_PURPLE_COLOR]: "reader.annotations.colors.purple", // "purple"
};

export const annotationColorCodeToColorSet: Record<string, TAnnotationColorSet> = {
    [ANNOTATION_PINK_COLOR]: "pink",
    [ANNOTATION_ORANGE_COLOR]: "orange",
    [ANNOTATION_YELLOW_COLOR]: "yellow",
    [ANNOTATION_GREEN_COLOR]: "green",
    [ANNOTATION_BLUE_COLOR]: "blue",
    [ANNOTATION_PURPLE_COLOR]: "purple",
};
export const annotationColorSetToColorCode: Record<string, string> = {
    "pink": ANNOTATION_PINK_COLOR,
    "orange": ANNOTATION_ORANGE_COLOR,
    "yellow": ANNOTATION_YELLOW_COLOR,
    "green": ANNOTATION_GREEN_COLOR,
    "blue": ANNOTATION_BLUE_COLOR,
    "purple": ANNOTATION_PURPLE_COLOR,
};

export interface IColor {
    red: number;
    green: number;
    blue: number;
}

export type TDrawType = "solid_background" | "underline" | "strikethrough" | "outline";

export const annotationDrawType: TDrawType[] = [
    "solid_background",
    "underline",
    "strikethrough",
    "outline",
];

export type IAnnotationPreParsingState = Pick<IAnnotationState, "uuid" | "comment" | "color" | "drawType" | "tags" | "modified" | "created" | "creator"> & { target: IReadiumAnnotation["target"] };

export interface IAnnotationState {
    uuid: string;
    locatorExtended: MiniLocatorExtended;
    comment: string;
    color: IColor;
    drawType: TDrawType;
    tags?: string[] | undefined;
    modified?: number;
    created: number;
    creator?: IAnnotationCreator;
}

export type TAnnotationState = IQueueAnnotationState[];
export type IQueueAnnotationState = IPQueueState<number, IAnnotationState>;

export type IAnnotationModeState = {
    enable: true;
    locatorExtended: MiniLocatorExtended;
} | {
    enable: false;
    locatorExtended: undefined;
};

export type TDrawView = "annotation" | "margin" | "hide";

export type TAnnotationTagsIndex = Record<string, number>;
