// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";
import { IOpdsLinkView } from "readium-desktop/common/views/opds";

export const ID = "IMPORT_VERIFICATION_REQUEST";

export interface Payload {
    link: IOpdsLinkView;
    r2OpdsPublicationBase64: string;
    title: string;
}

export function build(
    link: IOpdsLinkView,
    r2OpdsPublicationBase64: string,
    title?: string,
): Action<typeof ID, Payload> {

    return {
        type: ID,
        payload: {
            link,
            r2OpdsPublicationBase64,
            title,
        },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
