// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";

export const ID = "OPDS_BREADCRUMB_TITLE_UPDATE";
export function build(path: string, title: string): Action<typeof ID, { path: string; title: string }> {
    return { type: ID, payload: { path, title } };
}
build.toString = () => ID;
export type TAction = ReturnType<typeof build>;
