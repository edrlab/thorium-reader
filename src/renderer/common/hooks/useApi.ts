// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { ReactReduxContext } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import { TApiMethod, TApiMethodName } from "readium-desktop/common/api/api.type";
import { TModuleApi } from "readium-desktop/common/api/moduleApi.type";
import { TMethodApi } from "readium-desktop/common/api/methodApi.type";
import { apiActions } from "readium-desktop/common/redux/actions";
import { ApiResponse } from "readium-desktop/common/redux/states/api";
import { TReturnPromiseOrGeneratorType } from "readium-desktop/typings/api";
import { useSyncExternalStore } from "./useSyncExternalStore";

export function useApi<T extends TApiMethodName>(_requestId: string | undefined, apiPath: T):
    [ApiResponse<TReturnPromiseOrGeneratorType<TApiMethod[T]>>, (...requestData: Parameters<TApiMethod[T]>) => void]
{

    const requestId = _requestId || React.useMemo(() => uuidv4(), []);
    const { store } = React.useContext(ReactReduxContext);
    React.useEffect(() => {
        return () => {
            store.dispatch(apiActions.clean.build(requestId));
        };
    }, []);
    const apiAction = (...requestData: Parameters<TApiMethod[T]>) => {
        const splitPath = apiPath.split("/");
        const moduleId = splitPath[0] as TModuleApi;
        const methodId = splitPath[1] as TMethodApi;
        store.dispatch(apiActions.request.build(requestId, moduleId, methodId, requestData));
    };

    const apiResult = useSyncExternalStore(store.subscribe, () => store.getState().api[requestId]);
    return [apiResult, apiAction];
};
