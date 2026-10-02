// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";
import { IOpdsLinkView } from "readium-desktop/common/views/opds";

export const ID = "OPDS_PUBLICATION_IMPORTED";

export interface Payload {
    link: IOpdsLinkView;
    publicationIdentifier: string;
}

export function build(link: IOpdsLinkView, publicationIdentifier: string): Action<typeof ID, Payload> {
    return {
        type: ID,
        payload: {
            link,
            publicationIdentifier,
        },
    };
}
build.toString = () => ID;
export type TAction = ReturnType<typeof build>;
