// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ISessionState } from "readium-desktop/common/redux/states/session";
import { IRTLFlipState } from "readium-desktop/common/redux/states/renderer/rtlFlip";
import { IKeyboardState } from "readium-desktop/common/redux/states/keyboard";
import { ReaderConfig } from "readium-desktop/common/models/reader";
import { ITheme } from "./theme";

export interface ICommonRootState {
    session: ISessionState
    keyboard: IKeyboardState;
    reader: {
        defaultConfig: ReaderConfig,
        disableRTLFlip: IRTLFlipState,
    };
    theme: ITheme;
}
