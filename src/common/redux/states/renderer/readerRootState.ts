// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ReaderConfig, ReaderInfo } from "readium-desktop/common/models/reader";
import { ICommonRootState } from "readium-desktop/common/redux/states/renderer/commonRootState";
import { IHighlightHandlerState } from "readium-desktop/renderer/reader/redux/state/highlight";
import { IPickerState } from "readium-desktop/renderer/reader/redux/state/picker";
import { ISearchState } from "readium-desktop/renderer/reader/redux/state/search";
import { TMapState } from "readium-desktop/utils/redux-reducers/map.reducer";

import { IHighlight } from "@r2-navigator-js/electron/common/highlight";
import { LocatorExtended } from "@r2-navigator-js/electron/renderer";

export interface IReaderRootState extends ICommonRootState {
    reader: IReaderStateReader;
    picker: IPickerState;
    search: ISearchState;
}

export interface IReaderStateReader {
    config: ReaderConfig;
    info: ReaderInfo;
    locator: LocatorExtended;
    highlight: {
        handler: TMapState<string, IHighlightHandlerState>;
        mounter: TMapState<string, IHighlight>;
    };
}
