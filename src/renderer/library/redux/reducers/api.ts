// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { apiActions } from "readium-desktop/common/redux/actions";
import { ApiState } from "readium-desktop/common/redux/states/api";
import { THttpGetBrowserResultView } from "readium-desktop/common/views/browser";
import { apiReducer } from "readium-desktop/renderer/common/redux/reducers/api";
import { BROWSE_OPDS_API_REQUEST_ID } from "readium-desktop/renderer/library/opds/constants";
import { attachLocalBookshelfPublicationToResult } from "readium-desktop/renderer/library/opds/localBookshelfPublication";
import { opdsActions } from "readium-desktop/renderer/library/redux/actions";
import { Reducer } from "redux";

type TAction = apiActions.result.TAction | apiActions.clean.TAction | opdsActions.publicationImported.TAction;

function libraryApiReducer_(
    state: ApiState<any> | undefined,
    action: TAction,
): ApiState<any> {
    if (action.type !== opdsActions.publicationImported.ID || !state) {
        return apiReducer(state, action);
    }

    const browserResponse = state[BROWSE_OPDS_API_REQUEST_ID];
    const browserResult = browserResponse?.data?.result as THttpGetBrowserResultView | undefined;
    const browserData = browserResult?.data;
    const opdsResult = browserData?.opds;
    if (!browserResponse || !browserResult || !browserData || !opdsResult) {
        return state;
    }

    const updatedOpdsResult = attachLocalBookshelfPublicationToResult(
        opdsResult,
        action.payload.link,
        action.payload.publicationIdentifier,
    );
    if (updatedOpdsResult === opdsResult) {
        return state;
    }

    return {
        ...state,
        [BROWSE_OPDS_API_REQUEST_ID]: {
            ...browserResponse,
            data: {
                ...browserResponse.data,
                result: {
                    ...browserResult,
                    data: {
                        ...browserData,
                        opds: updatedOpdsResult,
                    },
                },
            },
        },
    };
}

export const libraryApiReducer = libraryApiReducer_ as Reducer<ReturnType<typeof libraryApiReducer_>>;
