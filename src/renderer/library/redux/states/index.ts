// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { RouterState } from "connected-react-router";
import { ImportState } from "readium-desktop/common/redux/states/import";
import { ICommonRootState } from "readium-desktop/common/redux/states/renderer/commonRootState";
import { IBreadCrumbItem } from "readium-desktop/renderer/common/models/breadcrumbItem.interface";
import { ILoadState } from "readium-desktop/renderer/common/redux/states/load";

import { IRouterLocationState } from "../../routing";
import { DownloadState } from "./download";
import { THistoryState } from "./history";
import { IOpdsHeaderState, IOpdsSearchState } from "./opds";

export interface ILibraryRootState extends ICommonRootState {
    opds: {
        browser: {
            breadcrumb: IBreadCrumbItem[];
            header: IOpdsHeaderState;
            search: IOpdsSearchState;
        };
    };
    router: RouterState<IRouterLocationState>;
    import: ImportState;
    download: DownloadState;
    history: THistoryState;
    updateCatalog: number;
    load: ILoadState;
}
