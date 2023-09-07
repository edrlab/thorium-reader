// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { RouterState } from "redux-first-history";
import { downloadActions } from "readium-desktop/common/redux/actions";
import { IRendererCommonRootState } from "readium-desktop/common/redux/states/rendererCommonRootState";
import { IBreadCrumbItem } from "readium-desktop/renderer/common/models/breadcrumbItem.interface";
import { ILoadState } from "readium-desktop/renderer/common/redux/states/load";
import { TPQueueState } from "readium-desktop/utils/redux-reducers/pqueue.reducer";

import { THistoryState } from "./history";
import { IOpdsHeaderState, IOpdsSearchState } from "./opds";
import { CatalogView } from "readium-desktop/common/views/catalog";

export interface ILibraryRootState extends IRendererCommonRootState {
    opds: {
        browser: {
            breadcrumb: IBreadCrumbItem[];
            header: IOpdsHeaderState;
            search: IOpdsSearchState;
        };
    };
    router: RouterState;
    download: TPQueueState<downloadActions.progress.Payload, number>;
    history: THistoryState;
    load: ILoadState;
    publication: {
        catalog: CatalogView,
        tag: string[],
    }
}
