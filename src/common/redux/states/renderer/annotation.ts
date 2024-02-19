// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { LocatorExtended } from "r2-navigator-js/dist/es8-es2017/src/electron/renderer";
import { TPQueueState } from "readium-desktop/utils/redux-reducers/pqueue.reducer";

export interface IColor {
    red: number;
    green: number;
    blue: number;
}

export interface IAnnotationState {
    uuid: string;
    locatorExtended: LocatorExtended;
    comment: string;
    color: IColor;
}

export type TAnnotationState = TPQueueState<number, IAnnotationState>;

export interface IAnnotationModeState {
    mode: { enable: boolean };
    focus: {
        editionEnable: boolean;
        currentFocusUuid: string;
        previousFocusUuid: string;
    }
}
