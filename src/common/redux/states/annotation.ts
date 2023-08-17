// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { IColor, IHighlightDefinition } from "@r2-navigator-js/electron/common/highlight";
import { TPQueueState } from "readium-desktop/utils/redux-reducers/pqueue.reducer";

export type TAnnotationState = TPQueueState<number, IAnnotationState>;

export interface IAnnotationState {
    uuid: string;
    name: string; // like bookmark name
    comment: string; // describe annotation mark
    hash: string; // sha256 ( `${href}:${JSON.stringify(def)}` ))
    href: string; // from IHighlightHandlerState
    def: IHighlightDefinition; // from IHighlightHandlerState
    color: IColor
}

export type IAnnotationStateWithoutUUID = Partial<Pick<IAnnotationState, "uuid">> & Pick<IAnnotationState, "name" | "comment" | "def" | "hash" | "href" | "color">;