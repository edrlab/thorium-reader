// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ReaderConfig, ReaderConfigPublisher, ReaderInfo, ReaderMode } from "readium-desktop/common/models/reader";
import { IRendererCommonRootState } from "readium-desktop/common/redux/states/rendererCommonRootState";
import { IDivinaState } from "readium-desktop/common/redux/states/renderer/divina";
import { IHighlightHandlerState, IHighlightMounterState } from "./highlight";
import { ISearchState } from "./search";
import { TMapState } from "readium-desktop/utils/redux-reducers/map.reducer";

// import { IHighlight } from "@r2-navigator-js/electron/common/highlight";

import { MiniLocatorExtended } from "readium-desktop/common/redux/states/locatorInitialState";

import { TBookmarkState } from "../bookmark";
import { IRTLFlipState } from "./rtlFlip";
import { IAnnotationModeState, TAnnotationState, TAnnotationTagsIndex } from "./annotation";
import { ITTSState } from "readium-desktop/renderer/reader/redux/state/tts";
import { IMediaOverlayState } from "readium-desktop/renderer/reader/redux/state/mediaOverlay";
import { IAllowCustomConfigState } from "readium-desktop/renderer/reader/redux/state/allowCustom";
import { ICacheDocument } from "./resourceCache";
import { IImageClickState } from "readium-desktop/renderer/reader/redux/state/imageClick";
import { DockState } from "../dock";
import { IBookmarkTotalCountState } from "readium-desktop/renderer/reader/redux/state/bookmarkTotalCount";

export interface IReaderRootState extends IRendererCommonRootState {
    reader: IReaderStateReader;
    search: ISearchState;
    resourceCache: ICacheDocument[];
    mode: ReaderMode;
    annotation: IAnnotationModeState;
    annotationTagsIndex: TAnnotationTagsIndex;
    img: IImageClickState; // TODO: replace by dock/dialog state
    dock: DockState;
    // cf dialog state in common
}

export interface IReaderStateReader {
    config: ReaderConfig;
    info: ReaderInfo;
    locator: MiniLocatorExtended;
    bookmark: TBookmarkState;
    annotation: TAnnotationState;
    highlight: {
        handler: TMapState<string, IHighlightHandlerState>;
        mounter: TMapState<string, IHighlightMounterState>;
    };
    divina: IDivinaState;

    disableRTLFlip: IRTLFlipState;
    defaultConfig: ReaderConfig; // sync across all app
    tts: ITTSState;
    mediaOverlay: IMediaOverlayState;
    allowCustomConfig: IAllowCustomConfigState;
    transientConfig: ReaderConfigPublisher;
    bookmarkTotalCount: IBookmarkTotalCountState;


    // got the lock
    // acquired on first reader opened with the same publication UUID instance
    // allow to do computation for the publication on one reader and not across reader
    // it is a kind of Mutex in multi-threading concept
    lock: boolean;
}
