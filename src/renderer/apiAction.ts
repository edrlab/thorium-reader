// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { apiActions } from "readium-desktop/common/redux/actions";
import { TApiMethod, TApiMethodName } from "readium-desktop/main/api/api.type";
import { TMethodApi, TModuleApi } from "readium-desktop/main/di";
import { diRendererGet } from "readium-desktop/renderer/di";
import { ApiLastSuccess } from "readium-desktop/renderer/redux/states/api";
import { ReturnPromiseType } from "readium-desktop/typings/promise";
import { Unsubscribe } from "redux";
import * as uuid from "uuid";

export async function apiAction<T extends TApiMethodName>(apiPath: T, ...requestData: Parameters<TApiMethod[T]>) {
    return new Promise<ReturnPromiseType<TApiMethod[T]>>((resolve, reject) => {
        const store = diRendererGet("store");
        const requestId = uuid.v4();
        const splitPath = apiPath.split("/");
        const moduleId = splitPath[0] as TModuleApi;
        const methodId = splitPath[1] as TMethodApi;
        let lastSuccess: ApiLastSuccess | undefined;
        let storeUnsubscribe: Unsubscribe| undefined;
        let timeoutId: number | undefined;

        store.dispatch(
            apiActions.buildRequestAction(
                requestId,
                moduleId,
                methodId,
                requestData,
            ),
        );

        const promise = new Promise<ReturnPromiseType<TApiMethod[T]>>((resolveSubscribe, rejectSubscribe) => {
            storeUnsubscribe = store.subscribe(() => {
                const state = store.getState();
                const apiLastSuccess = state.api.lastSuccess;
                const lastSuccessDate = (lastSuccess && lastSuccess.date) || 0;

                if (!apiLastSuccess || apiLastSuccess.date <= lastSuccessDate) {
                    return;
                }

                // New api success
                lastSuccess = apiLastSuccess;

                const meta = apiLastSuccess.action.meta.api;
                if (moduleId === meta.moduleId && methodId === meta.methodId && state.api.data[requestId]) {
                    const request = Object.assign({}, state.api.data[requestId]);
                    store.dispatch(apiActions.clean(requestId));
                    if (request.resultIsReject) {
                        rejectSubscribe(request.result);
                        return ;
                    }
                    resolveSubscribe(request.result);
                    return ;
                }

                // handle promise<void>
                timeoutId = window.setTimeout(() => {
                    timeoutId = undefined;
                    rejectSubscribe("API Timeout");
                }, 5000);
            });
        });

        promise.then((result) => {
            resolve(result);
        }).catch((error) => {
            reject(error);
        }).finally(() => {
            if (storeUnsubscribe) {
                storeUnsubscribe();
            }
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        });
    });
}
