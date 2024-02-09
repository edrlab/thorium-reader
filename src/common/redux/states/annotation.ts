// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { LocatorExtended } from "@r2-navigator-js/electron/renderer";
import { IColor } from "r2-navigator-js/dist/es8-es2017/src/electron/common/highlight";
import { TPQueueState } from "readium-desktop/utils/redux-reducers/pqueue.reducer";

export type TAnnotationState = TPQueueState<number, IAnnotationState>;

export interface IAnnotationState {
    uuid: string;
    comment: string; // describe annotation mark
    hash: string; // sha256 ( `${href}:${JSON.stringify(def)}` ))
    // def: IHighlightDefinition; // from IHighlightHandlerState
    def: LocatorExtended;
    color: IColor
}

export type IAnnotationStateWithoutUUID = Partial<Pick<IAnnotationState, "uuid">> & Pick<IAnnotationState, "comment" | "def" | "hash" | "color">;
