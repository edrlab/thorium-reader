// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { WindowReaderDestination, WithDestination } from "readium-desktop/common/models/sync";
import { Action } from "readium-desktop/common/models/redux";
import { ToastType } from "readium-desktop/common/models/toast";

export const ID = "TOAST_OPEN_REQUEST";

export interface Payload {
    type: ToastType;
    data: string | undefined;
    publicationIdentifier: string | undefined;
    /** Opt into auto-dismissal only for information available elsewhere; omitted means persistent. */
    timeout?: number;
}

export function build(type: ToastType, data: string, publicationIdentifier?: string, windowIdentifier?: string, timeout?: number):
    Action<typeof ID, Payload> & Partial<WithDestination<WindowReaderDestination>> {

    return {
        type: ID,
        ...(windowIdentifier ? { destination: { identifier: windowIdentifier } } : {}),
        payload: {
            type,
            data,
            publicationIdentifier,
            ...(timeout !== undefined ? { timeout } : {}),
        },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
