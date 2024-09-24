// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";
import { IAnnotationModeState } from "readium-desktop/common/redux/states/renderer/annotation";

import { MiniLocatorExtended } from "readium-desktop/common/redux/states/locatorInitialState";

export const ID = "READER_ANNOTATIONS_MODE_ENABLE";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
// interface IPayload extends Partial<IAnnotationModeState> {
// }
// type IPayload = {} & IAnnotationModeState;
type IPayload = IAnnotationModeState;

export function build(enable: false, locatorExtended: undefined): Action<typeof ID, IPayload>;
export function build(enable: true, locatorExtended: MiniLocatorExtended): Action<typeof ID, IPayload>;
export function build(enable: boolean, locatorExtended: MiniLocatorExtended | undefined): Action<typeof ID, IPayload> {
    return {
        type: ID,
        payload: enable === true ? { enable: true, locatorExtended } : { enable: false, locatorExtended: undefined },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
