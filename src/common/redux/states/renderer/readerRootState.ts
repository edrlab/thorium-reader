// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ReaderConfig, ReaderInfo, ReaderMode } from "readium-desktop/common/models/reader";
import { IRendererCommonRootState } from "readium-desktop/common/redux/states/rendererCommonRootState";
import { IDivinaState } from "readium-desktop/common/redux/states/renderer/divina";
import { IHighlightHandlerState, IHighlightMounterState } from "./highlight";
import { IPickerState } from "./picker";
import { ISearchState } from "./search";
import { TMapState } from "readium-desktop/utils/redux-reducers/map.reducer";

// import { IHighlight } from "@r2-navigator-js/electron/common/highlight";
import { LocatorExtended } from "@r2-navigator-js/electron/renderer";

import { TBookmarkState } from "../bookmark";
import { IRTLFlipState } from "./rtlFlip";
import { IAnnotationModeState, TAnnotationState } from "./annotation";

export interface IReaderRootState extends IRendererCommonRootState {
    reader: IReaderStateReader;
    picker: IPickerState;
    search: ISearchState;
    mode: ReaderMode;
    annotationControlMode: IAnnotationModeState;
}

export interface IReaderStateReader {
    config: ReaderConfig;
    info: ReaderInfo;
    locator: LocatorExtended;
    bookmark: TBookmarkState;
    annotation: TAnnotationState;
    highlight: {
        handler: TMapState<string, IHighlightHandlerState>;
        mounter: TMapState<string, IHighlightMounterState>;
    };
    divina: IDivinaState;

    disableRTLFlip: IRTLFlipState;
    defaultConfig: ReaderConfig; // sync across all app
}
