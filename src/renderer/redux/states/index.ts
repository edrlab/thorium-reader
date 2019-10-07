// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { RouterState } from "connected-react-router";

import { ApiState } from "./api";
import { DownloadState } from "./download";
import { OpdsState } from "./opds";
import { ReaderState } from "./reader";
import { WinState } from "./win";

import { DialogState } from "readium-desktop/common/redux/states/dialog";
import { I18NState } from "readium-desktop/common/redux/states/i18n";
import { ImportState } from "readium-desktop/common/redux/states/import";
import { NetState } from "readium-desktop/common/redux/states/net";
import { ToastState } from "readium-desktop/common/redux/states/toast";
import { UpdateState } from "readium-desktop/common/redux/states/update";

export { WinState };

export interface RootState {
    net: NetState;
    win: WinState;
    i18n: I18NState;
    opds: OpdsState;
    reader: ReaderState;
    update: UpdateState;
    api: ApiState<any>;
    dialog: DialogState;
    router: RouterState;
    import: ImportState;
    toast: ToastState;
    download: DownloadState;
}
