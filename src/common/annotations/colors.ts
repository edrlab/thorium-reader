// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import type { IColor } from "@r2-navigator-js/electron/common/highlight";
import { hexToRgb } from "readium-desktop/common/rgb";
import type { TTranslatorKeyParameter } from "readium-desktop/typings/en.translation-keys";

// DO NOT REMOVE THIS COMMENT BLOCK (USED FOR TRANSLATOR KEYS DETECTION DURING CODE SCANNING)
// __("reader.notes.colors.red")
// __("reader.notes.colors.orange")
// __("reader.notes.colors.yellow")
// __("reader.notes.colors.green")
// __xxx("reader.notes.colors.bluegreen") // ===> "bluegreen" translation becomes unused!
// __xxx("reader.notes.colors.lightblue") // ===> "lightblue" translation becomes unused!
// __("reader.notes.colors.cyan")
// __("reader.notes.colors.purple")

export const ANNOTATION_PINK_COLOR = "#EB9694";
export const ANNOTATION_ORANGE_COLOR = "#FAD0C3";
export const ANNOTATION_YELLOW_COLOR = "#FEF3BD";
export const ANNOTATION_GREEN_COLOR = "#C1EAC5";
export const ANNOTATION_BLUE_COLOR = "#BED3F3";
export const ANNOTATION_PURPLE_COLOR = "#D4C4FB";

// https://github.com/readium/notes/blob/main/README.md#14-body
export const annotationColorCodeToColorTranslatorKeySet: Record<string, TTranslatorKeyParameter> = {
    [ANNOTATION_PINK_COLOR]: "reader.notes.colors.red", // "pink"
    [ANNOTATION_ORANGE_COLOR]: "reader.notes.colors.orange", // "orange"
    [ANNOTATION_YELLOW_COLOR]: "reader.notes.colors.yellow", // "yellow"
    [ANNOTATION_GREEN_COLOR]: "reader.notes.colors.green", // "green"
    // "#BEDADC": "reader.notes.colors.bluegreen", // ===> "bluegreen" translation becomes unused!
    // "#C4DEF6": "reader.notes.colors.lightblue", // ===> "lightblue" translation becomes unused!
    [ANNOTATION_BLUE_COLOR]: "reader.notes.colors.cyan", // "blue"
    [ANNOTATION_PURPLE_COLOR]: "reader.notes.colors.purple", // "purple"
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

export type TAnnotationColorSet = "pink" | "orange" | "yellow" | "green" | "blue" | "purple";
export const ANNOTATION_DEFAULT_COLOR: TAnnotationColorSet = "yellow";
export const ANNOTATION_DEFAULT_COLOR_OBJ: IColor = hexToRgb(annotationColorSetToColorCode[ANNOTATION_DEFAULT_COLOR]);
