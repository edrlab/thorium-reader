// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { nanoid } from "nanoid";
import { OpdsFeed } from "readium-desktop/common/models/opds";
import { Action } from "readium-desktop/common/models/redux";
import { OpdsFeedDocument } from "readium-desktop/main/db/document/opds";

export const ID = "OPDSFEED_ADD";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Payload extends Array<OpdsFeedDocument> {}

export function build(...feed: Array<OpdsFeedDocument | OpdsFeed>):
    Action<typeof ID, Payload> {

    const docs = feed.map<OpdsFeedDocument>((v) => ({
        ...v,
        createdAt: (v as OpdsFeedDocument).createdAt || (new Date()).getTime(),
        updatedAt: (new Date()).getTime(),
        identifier: v.identifier || nanoid(),
    }));

    return {
        type: ID,
        payload: docs,
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
