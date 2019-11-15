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
        let storeUnsubscribe: Unsubscribe | undefined;
        let timeoutId: number | undefined;

        store.dispatch(
            apiActions.request.build(
                requestId,
                moduleId,
                methodId,
                requestData,
            ),
        );

        const promise = new Promise<ReturnPromiseType<TApiMethod[T]>>((resolveSubscribe, rejectSubscribe) => {
            storeUnsubscribe = store.subscribe(() => {
                const state = store.getState();
                const lastTime = (state.api[requestId]?.lastTime) || 0;

                if (state.api[requestId]?.data.time > lastTime) {
                    const data = { ...state.api[requestId].data };
                    store.dispatch(apiActions.clean.build(requestId));
                    if (data.error) {
                        rejectSubscribe(data.errorMessage);
                        return ;
                    }
                    resolveSubscribe(data.result);
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
