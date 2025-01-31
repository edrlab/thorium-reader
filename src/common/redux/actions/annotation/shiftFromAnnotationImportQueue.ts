// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ActionAcrossRenderer } from "readium-desktop/common/models/sync";

export const ID = "ANNOTATION_SHIFT_FROM_ANNOTATION_IMPORT_QUEUE";

export interface Payload {
}
export function build(): ActionAcrossRenderer<typeof ID, Payload> {
    return {
        type: ID,
        payload: {
        },
        sendActionAcrossRenderer: true,
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
