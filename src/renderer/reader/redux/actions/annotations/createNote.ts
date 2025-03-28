// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { IColor } from "@r2-navigator-js/electron/common/highlight";
import { Action } from "readium-desktop/common/models/redux";
import { EDrawType, INoteState, TDrawType } from "readium-desktop/common/redux/states/renderer/note";

export const ID = "READER_ANNOTATIONS_CREATE_NOTE";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IPayload extends Pick<INoteState, "color"|"textualValue"|"drawType"|"tags"> {
}

export function build(color: IColor, comment: string, drawType: TDrawType, tags: string[]):
    Action<typeof ID, IPayload> {

    return {
        type: ID,
        payload: { color, textualValue: comment, drawType: EDrawType[drawType], tags },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
