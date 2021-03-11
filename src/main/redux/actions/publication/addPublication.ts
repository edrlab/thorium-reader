// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";
import { IPublicationState } from "../../states/publication";

export const ID = "PUBLICATION_ADD";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IPayload extends Array<IPublicationState> {};

/**
 * add or update a publicationDocument in the redux main state database
 */
export function build(...pubs: IPublicationState[]):
    Action<typeof ID, IPayload> {

    return {
        type: ID,
        payload: pubs,
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;

