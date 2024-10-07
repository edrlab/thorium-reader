// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { MiniLocatorExtended } from "readium-desktop/common/redux/states/locatorInitialState";

import { TPQueueState } from "readium-desktop/utils/redux-reducers/pqueue.reducer";
import { creatorActions } from "../../actions";
import { IAnnotationCreator } from "../creator";

export interface IColor {
    red: number;
    green: number;
    blue: number;
}

export type TDrawType = "solid_background" | "underline" | "strikethrough" | "outline";

export interface IAnnotationState {
    uuid: string;
    locatorExtended: MiniLocatorExtended;
    comment: string;
    color: IColor;
    drawType: TDrawType;
    tags?: string[] | undefined;
    modified?: number;
    creator?: IAnnotationCreator;
}

export type TAnnotationState = TPQueueState<number, IAnnotationState>;

export type IAnnotationModeState = {
    enable: true;
    locatorExtended: MiniLocatorExtended;
} | {
    enable: false;
    locatorExtended: undefined;
};

export type TDrawView = "annotation" | "margin" | "hide";

export interface IAnnotationReaderConfigState {
    annotation_popoverNotOpenOnNoteTaking: boolean;
    annotation_defaultColor: IColor;
    annotation_defaultDrawType: TDrawType;
    annotation_defaultDrawView: TDrawView;
}

export type TAnnotationTagsIndex = Record<string, number>;
