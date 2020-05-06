// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { DialogState } from "readium-desktop/common/redux/states/dialog";
import { I18NState } from "readium-desktop/common/redux/states/i18n";
import { KeyboardState } from "readium-desktop/common/redux/states/keyboard";
import { ToastState } from "readium-desktop/common/redux/states/toast";
import { ApiState } from "readium-desktop/renderer/common/redux/states/api";

import { WinState } from "../../../../renderer/common/redux/states/win";

export interface ICommonRootState {
    api: ApiState<any>;
    i18n: I18NState;
    win: WinState;
    dialog: DialogState;
    toast: ToastState;
    keyboard: KeyboardState;
}
