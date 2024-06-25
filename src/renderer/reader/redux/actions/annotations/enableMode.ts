// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";
import { IAnnotationModeState } from "readium-desktop/common/redux/states/renderer/annotation";
import { LocatorExtended } from "r2-navigator-js/dist/es8-es2017/src/electron/renderer";

export const ID = "READER_ANNOTATIONS_MODE_ENABLE";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
// interface IPayload extends Partial<IAnnotationModeState> {
// }
// type IPayload = {} & IAnnotationModeState;
type IPayload = IAnnotationModeState;

export function build(enable: false, locatorExtended: undefined): Action<typeof ID, IPayload>;
export function build(enable: true, locatorExtended: LocatorExtended): Action<typeof ID, IPayload>;
export function build(enable: boolean, locatorExtended: LocatorExtended | undefined): Action<typeof ID, IPayload> {
    return {
        type: ID,
        payload: enable === true ? { enable: true, locatorExtended } : { enable: false, locatorExtended: undefined },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
