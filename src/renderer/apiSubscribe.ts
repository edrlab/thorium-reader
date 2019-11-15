// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { TApiMethodName } from "readium-desktop/main/api/api.type";
import { diRendererGet } from "readium-desktop/renderer/di";
import { Unsubscribe } from "redux";

import { LAST_API_SUCCESS_ID } from "./redux/states/api";

/**
 * subscribe to redux to automaticaly execute callback when any path in parameter is called on IPC
 *
 * don't forget to unsubscribe with the return value of function
 */
export function apiSubscribe(pathArrayToRefresh: TApiMethodName[], cb: () => void | Promise<void>): Unsubscribe {
    const store = diRendererGet("store");
    const lastApiSuccess = store.getState().api[LAST_API_SUCCESS_ID];
    let lastSuccessTime = lastApiSuccess?.lastTime || 0;

    cb();

    return store.subscribe(() => {
        const state = store.getState();
        const lastApiSuccessInSubscribe = state.api[LAST_API_SUCCESS_ID];

        if (lastApiSuccessInSubscribe?.lastTime > lastSuccessTime) {
            lastSuccessTime = lastApiSuccessInSubscribe.lastTime;
            const data = state.api[LAST_API_SUCCESS_ID].data;
            if (!data.error) {
                const path = `${data.moduleId}/${data.methodId}` as TApiMethodName;
                if (pathArrayToRefresh.includes(path)) {
                    cb();
                }
            }
        }
    });
}
