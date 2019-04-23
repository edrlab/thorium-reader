// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { RouterState } from "connected-react-router";

import { DialogState } from "readium-desktop/common/redux/states/dialog";
import { I18NState } from "readium-desktop/common/redux/states/i18n";
import { NetState } from "readium-desktop/common/redux/states/net";

import { UpdateState } from "readium-desktop/common/redux/states/update";

import { ReaderState } from "./reader";

import { ApiState } from "./api";

import { WinState } from "./win";

import { OpdsState } from "./opds";

export { WinState };

export interface RootState {
    net: NetState;
    win: WinState;
    i18n: I18NState;
    opds: OpdsState;
    reader: ReaderState;
    update: UpdateState;
    api: ApiState;
    dialog: DialogState;
    router: RouterState;
}
