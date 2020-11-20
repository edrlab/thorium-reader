// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";
import { PublicationView } from "readium-desktop/common/views/publication";

export const ID = "LCP_USER_KEY_CHECK_REQUEST";

export interface Payload {
    publicationView: PublicationView;
    message: string;
    hint: string;
    urlHint: {
        href: string,
        title?: string,
    };
}

export function build(
    publicationView: PublicationView,
    hint: string,
    urlHint: Payload["urlHint"] | undefined,
    message: string | undefined,
):
    Action<typeof ID, Payload> {

    return {
        type: ID,
        payload: {
            publicationView,
            hint,
            urlHint,
            message,
        },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
