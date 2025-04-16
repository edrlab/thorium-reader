// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer } from "redux";
import { INoteExportState } from "../states/renderer/note";
import { noteExport } from "../actions";

function noteExportReducer_(
    state = {
        overrideHTMLTemplate: false,
        htmlContent: "",
    },
    action: noteExport.overrideHTMLTemplate.TAction,
): INoteExportState {

    switch (action.type) {
        case noteExport.overrideHTMLTemplate.ID:
            return {
                overrideHTMLTemplate: action.payload.overrideHTMLTemplate,
                htmlContent: action.payload.htmlContent,
            };
        default:
            return state;
    }
}

export const noteExportReducer = noteExportReducer_ as Reducer<ReturnType<typeof noteExportReducer_>>;
