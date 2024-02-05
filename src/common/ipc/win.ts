// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";

export enum EventType {
    IdRequest = "ID_REQUEST",
    IdResponse = "ID_RESPONSE",
}

export const CHANNEL = "WIN";

export interface EventPayload {
    type: EventType;
    payload: Partial<ILibraryRootState>;
}
