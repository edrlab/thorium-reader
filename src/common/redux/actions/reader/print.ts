
// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ActionWithDestination } from "readium-desktop/common/models/sync";

export const ID = "READER_PRINT";

export interface Payload {
    publicationIdentifier: string,
    pageRange: number[],
}

export function build(publicationIdentifier: string, pageRange: number[], winId?: string):
    ActionWithDestination<typeof ID, Payload> {

    return {
        type: ID,
        payload: {
            publicationIdentifier,
            pageRange,
        },
        destination: winId ? {
            identifier: winId,
        } : undefined,
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
