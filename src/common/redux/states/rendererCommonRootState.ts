// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { DialogState } from "readium-desktop/common/redux/states/dialog";
import { ToastState } from "readium-desktop/common/redux/states/toast";
import { ApiState } from "readium-desktop/common/redux/states/api";
import { WinState } from "readium-desktop/common/redux/states/win";
import { ICommonRootState } from "./commonRootState";
import { IImportAnnotationState } from "./importAnnotation";

export interface IRendererCommonRootState extends ICommonRootState {
    api: ApiState<any>;
    win: WinState;
    dialog: DialogState;
    toast: ToastState;
    importAnnotations: IImportAnnotationState,
    publication: {
        tag: string[]
    }
}

export type IRendererCommonRootStateHydration = Pick<IRendererCommonRootState, "win" | "i18n" | "keyboard" | "theme" | "reader" | "creator" | "noteExport" | "publication">;
