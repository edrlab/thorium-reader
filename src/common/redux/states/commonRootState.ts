// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ISessionState } from "readium-desktop/common/redux/states/session";
import { IVersionUpdateState } from "readium-desktop/common/redux/states/version";
import { IRTLFlipState } from "readium-desktop/common/redux/states/renderer/rtlFlip";
import { IKeyboardState } from "readium-desktop/common/redux/states/keyboard";
import { ReaderConfig } from "readium-desktop/common/models/reader";
import { ITheme } from "./theme";
import { INoteCreator } from "./creator";
import { I18NState } from "readium-desktop/common/redux/states/i18n";
import { TFIFOState } from "readium-desktop/utils/redux-reducers/fifo.reducer";
import { IAnnotationPreParsingState } from "./renderer/annotation";
import { IApiKeysArray } from "readium-desktop/common/redux/states/api_key";
import { ILcpState } from "./lcp";

export interface ICommonRootState {
    i18n: I18NState;
    session: ISessionState;
    versionUpdate: IVersionUpdateState;
    keyboard: IKeyboardState;
    reader: {
        defaultConfig: ReaderConfig,
        disableRTLFlip: IRTLFlipState,
    };
    theme: ITheme;
    creator: INoteCreator;
    annotationImportQueue: TFIFOState<IAnnotationPreParsingState>;
    apiKeys: IApiKeysArray;
    lcp: ILcpState;
}
