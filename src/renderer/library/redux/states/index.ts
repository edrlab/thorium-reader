// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { RouterState } from "connected-react-router";
import { DialogState } from "readium-desktop/common/redux/states/dialog";
import { I18NState } from "readium-desktop/common/redux/states/i18n";
import { ImportState } from "readium-desktop/common/redux/states/import";
import { ToastState } from "readium-desktop/common/redux/states/toast";
import { IBreadCrumbItem } from "readium-desktop/renderer/common/models/breadcrumbItem.interface";
import { ICommonRootState } from "readium-desktop/renderer/common/redux/states";
import { ApiState } from "readium-desktop/renderer/common/redux/states/api";
import { WinState } from "readium-desktop/renderer/common/redux/states/win";
import { TRootState } from "readium-desktop/renderer/library/redux/reducers";

import { IRouterLocationState } from "../../routing";
import { DownloadState } from "./download";
import { THistoryState } from "./history";
import { IOpdsHeaderState, IOpdsSearchState } from "./opds";

export type RootState = TRootState;

export interface ILibraryRootState extends ICommonRootState {
    i18n: I18NState;
    opds: {
        browser: {
            breadcrumb: IBreadCrumbItem[];
            header: IOpdsHeaderState;
            search: IOpdsSearchState;
        };
    };
    win: WinState;
    api: ApiState<any>;
    dialog: DialogState;
    router: RouterState<IRouterLocationState>;
    import: ImportState;
    toast: ToastState;
    download: DownloadState;
    history: THistoryState;
}
