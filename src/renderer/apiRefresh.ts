// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { TApiMethodName } from "readium-desktop/main/api/api.type";
import { TMethodApi, TModuleApi } from "readium-desktop/main/di";
import { diRendererGet } from "readium-desktop/renderer/di";
import { ApiLastSuccess } from "readium-desktop/renderer/redux/states/api";
import { Unsubscribe } from "redux";

/**
 * subscribe to redux to automaticaly execute callback when any path in parameter is called on IPC
 *
 * don't forget to unsubscribe with the return value of function
 */
export function apiRefresh(pathArrayToRefresh: TApiMethodName[], cb: () => void | Promise<void>): Unsubscribe {
    const store = diRendererGet("store");
    let lastSuccess: ApiLastSuccess | undefined;

    cb();

    return store.subscribe(() => {
        const state = store.getState();
        const apiLastSuccess = state.api.lastSuccess;
        const lastSuccessDate = (lastSuccess && lastSuccess.date) || 0;

        if (!apiLastSuccess || apiLastSuccess.date <= lastSuccessDate) {
            return;
        }

        // New api success
        lastSuccess = apiLastSuccess;

        const meta = apiLastSuccess.action.meta.api;
        if (pathArrayToRefresh.find((apiPath) => {
            const splitPath = apiPath.split("/");
            const moduleId = splitPath[0] as TModuleApi;
            const methodId = splitPath[1] as TMethodApi;
            return meta.methodId === methodId && meta.moduleId === moduleId;
        })) {
            cb();
        }
    });
}
