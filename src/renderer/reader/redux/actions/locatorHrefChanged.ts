// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";

export const ID = "READER_LOCATOR_HREF_CHANGED";

// tslint:disable-next-line: no-empty-interface
interface IPayload {
    href: string;
}

export function build(href: string):
    Action<typeof ID, IPayload> {

    return {
        type: ID,
        payload: {
            href,
        },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
