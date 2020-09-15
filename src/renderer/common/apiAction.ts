// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { TApiMethod, TApiMethodName } from "readium-desktop/common/api/api.type";
import { TMethodApi } from "readium-desktop/common/api/methodApi.type";
import { TModuleApi } from "readium-desktop/common/api/moduleApi.type";
import { apiActions } from "readium-desktop/common/redux/actions";
import { TReturnPromiseOrGeneratorType } from "readium-desktop/typings/api";
import { Store, Unsubscribe } from "redux";
import { v4 as uuidv4 } from "uuid";

export function apiActionFactory(storeCb: () => Store<any>) {
    return async <T extends TApiMethodName>(apiPath: T, ...requestData: Parameters<TApiMethod[T]>) => {
        return new Promise<TReturnPromiseOrGeneratorType<TApiMethod[T]>>(
            async (resolve, reject) => {
                const store = storeCb();
                const requestId = uuidv4();
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

                const promise = new Promise<TReturnPromiseOrGeneratorType<TApiMethod[T]>>(
                    (resolveSubscribe, rejectSubscribe) => {
                    storeUnsubscribe = store.subscribe(() => {
                        const state = store.getState();
                        const lastTime = (state.api[requestId]?.lastTime) || 0;

                        if (state.api[requestId]?.data.time > lastTime) {
                            const data = { ...state.api[requestId].data };
                            store.dispatch(apiActions.clean.build(requestId));
                            if (data.error) {
                                rejectSubscribe(data.errorMessage);
                                return;
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

                try {
                    const result = await promise;
                    resolve(result);
                } catch (error) {
                    reject(error);
                } finally {
                    if (storeUnsubscribe) {
                        storeUnsubscribe();
                    }
                    if (timeoutId) {
                        clearTimeout(timeoutId);
                    }
                }
            });
    };
}
