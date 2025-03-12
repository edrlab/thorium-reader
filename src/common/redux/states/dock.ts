// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { DockType } from "readium-desktop/common/models/dock";

export interface IDockStateData<T extends keyof DockType = keyof DockType> {
    type: T;
    data: DockType[T];
}

export interface DockState extends IDockStateData {
    open: boolean;
}
