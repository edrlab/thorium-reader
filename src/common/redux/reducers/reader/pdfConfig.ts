// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer } from "redux";

import { readerActions } from "readium-desktop/common/redux/actions";
import { IReaderPdfConfig } from "../../states/renderer/readerRootState";

function readerPdfConfigReducer_(
    state: IReaderPdfConfig = {
        scale: "page-fit",
        spreadmode: 0,
    },
    action: readerActions.pdfConfig.TAction,
): IReaderPdfConfig {

    switch (action.type) {
        case readerActions.pdfConfig.ID:
            return {
                ...action.payload.config,
            };

        default:
            return state;
    }
}

export const readerPdfConfigReducer = readerPdfConfigReducer_ as Reducer<IReaderPdfConfig>;
