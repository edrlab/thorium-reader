// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export const ID = "CUSTOMIZATION_WELCOME_SCREEN";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IPayload {
    enable: boolean;
}

export function build(enable: boolean) {

    return {
        type: ID,
        payload: {
            enable,
        },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;

