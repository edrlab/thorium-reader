// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ReaderConfig, ReaderInfo, ReaderMode } from "readium-desktop/common/models/reader";
import { IRendererCommonRootState } from "readium-desktop/common/redux/states/rendererCommonRootState";
import { IDivinaState } from "readium-desktop/renderer/reader/redux/state/divina";
import { IHighlightHandlerState } from "readium-desktop/renderer/reader/redux/state/highlight";
import { IPickerState } from "readium-desktop/renderer/reader/redux/state/picker";
import { ISearchState } from "readium-desktop/renderer/reader/redux/state/search";
import { TMapState } from "readium-desktop/utils/redux-reducers/map.reducer";

import { IHighlight } from "@r2-navigator-js/electron/common/highlight";
import { LocatorExtended } from "@r2-navigator-js/electron/renderer";

import { TBookmarkState } from "../bookmark";

export interface IReaderRootState extends IRendererCommonRootState {
    reader: IReaderStateReader;
    picker: IPickerState;
    search: ISearchState;
    mode: ReaderMode;
}

export interface IReaderStateReader {
    config: ReaderConfig;
    info: ReaderInfo;
    locator: LocatorExtended;
    bookmark: TBookmarkState;
    highlight: {
        handler: TMapState<string, IHighlightHandlerState>;
        mounter: TMapState<string, IHighlight>;
    };
    divina: IDivinaState;
}
