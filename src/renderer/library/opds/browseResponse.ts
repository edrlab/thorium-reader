// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { THttpGetBrowserResultView } from "readium-desktop/common/views/browser";

// A one-use handoff to the route watcher. Do not persist acquisition responses in history.
let pending: { path: string; result: THttpGetBrowserResultView } | undefined;

export const handOffBrowseResponse = (path: string, result: THttpGetBrowserResultView): void => {
    pending = { path, result };
};

export const takeBrowseResponse = (path: string): THttpGetBrowserResultView | undefined => {
    const response = pending;
    pending = undefined;
    return response?.path === path ? response.result : undefined;
};
