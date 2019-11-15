// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action as ReduxAction } from "redux";

export interface Action<Type = string, Payload = undefined, Meta = undefined>
    extends ReduxAction<Type> {

    payload?: Payload;
    meta?: Meta;
    error?: boolean;
}
