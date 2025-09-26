// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export const ID = "CUSTOMIZATION_ADD_HISTORY";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IPayload {
    id: string;
    version: string;
}

export function build(profileIdentifier: string, version: string) {

    return {
        type: ID,
        payload: {
            id: profileIdentifier,
            version,
        },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;

