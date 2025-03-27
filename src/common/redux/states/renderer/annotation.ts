// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { MiniLocatorExtended } from "readium-desktop/common/redux/states/locatorInitialState";

import { IPQueueState } from "readium-desktop/utils/redux-reducers/pqueue.reducer";
import { INoteCreator } from "../creator";
import { IReadiumAnnotation } from "readium-desktop/common/readium/annotation/annotationModel.type";
import { IColor } from "@r2-navigator-js/electron/common/highlight";

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
    creator?: INoteCreator;
}

export type TAnnotationState = IQueueAnnotationState[];
export type IQueueAnnotationState = IPQueueState<number, IAnnotationState>;

export type IAnnotationModeState = {
    enable: true;
    locatorExtended: MiniLocatorExtended;
    fromKeyboard: boolean;
} | {
    enable: false;
    locatorExtended: undefined;
    fromKeyboard: undefined;
};

export type TDrawView = "annotation" | "margin" | "hide";

export type TAnnotationTagsIndex = Record<string, number>;
