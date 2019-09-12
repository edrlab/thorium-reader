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
import { Unsubscribe } from "redux";
import * as uuid from "uuid";

/**
 * Obtain the promise return type of a function type
 */
export type ReturnPromiseType<T extends (...args: any) => any> = T extends (...args: any) => Promise<infer R> ? R : any;

export async function apiFetch<T extends TApiMethodName>(path: T, ...requestData: Parameters<TApiMethod[T]>) {
    return new Promise<ReturnPromiseType<TApiMethod[T]>>((resolve, reject) => {
        const store = diRendererGet("store");
        const requestId = uuid.v4();
        const moduleId = path.split("/")[0] as TModuleApi;
        const methodId = path.split("/")[1] as TMethodApi;
        let lastSuccess: ApiLastSuccess | undefined;
        let storeUnsubscribe: Unsubscribe| undefined;
        let timeout: number | undefined;

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
                    }
                    resolveSubscribe(request.result);
                }

                // handle promise<void>
                timeout = window.setTimeout(() => reject("API Timeout"), 5000);
            });
        });

        // The linter doesn't accept .finaly(). Why ? Is it a Bug ?
        // tslint:disable-next-line: no-floating-promises
        promise.then((result) => {
            resolve(result);
        }).catch((error) => {
            reject(error);
        }).finally(() => {
            if (storeUnsubscribe) {
                storeUnsubscribe();
            }
            if (timeout) {
                clearTimeout(timeout);
            }
        });
    });
}

/*
const test = () => {
    apiFetch("publication/importOpdsEntry", null).then((data) => {
        // body
    });
};
*/
