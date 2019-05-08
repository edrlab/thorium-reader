// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { CatalogState } from "readium-desktop/common/redux/states/catalog";

import { I18NState } from "readium-desktop/common/redux/states/i18n";

import { NetState } from "readium-desktop/common/redux/states/net";

import { UpdateState } from "readium-desktop/common/redux/states/update";

import { AppState } from "./app";
import { ReaderState } from "./reader";
import { StreamerState } from "./streamer";

export interface RootState {
    app: AppState;
    net: NetState;
    i18n: I18NState;
    streamer: StreamerState;
    catalog: CatalogState;
    reader: ReaderState;
    update: UpdateState;
}
