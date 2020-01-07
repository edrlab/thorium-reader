// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { apiActions } from "readium-desktop/common/redux/actions";
import { TApiMethod, TApiMethodName } from "readium-desktop/main/api/api.type";
import { TMethodApi, TModuleApi } from "readium-desktop/main/di";
import { ReactComponent } from "readium-desktop/renderer/components/utils/reactComponent";
import { diRendererGet } from "readium-desktop/renderer/di";
import { TRootState } from "readium-desktop/renderer/redux/reducers";
import { ApiResponse, LAST_API_SUCCESS_ID } from "readium-desktop/renderer/redux/states/api";
import { ReturnPromiseType } from "readium-desktop/typings/promise";
import { shallowEqual } from "readium-desktop/utils/shallowEqual";
import { Unsubscribe } from "redux";
import * as uuid from "uuid";

export type TApiDecorator<T extends TApiMethodName> = {
    [key in T]: {
        request: (...requestData: Parameters<TApiMethod[T]>) => void;
        result?: Readonly<ApiResponse<ReturnPromiseType<TApiMethod[T]>>> | undefined;
        needRefresh: boolean
    };
};

interface IApiDataInternal<
    TPath extends TApiMethodName
    > {
    moduleId: TModuleApi;
    methodId: TMethodApi;
    requestId: string;
    apiPath: TPath;
    refresh: TApiMethodName[];
    requestDataFct: (reduxState?: TRootState, props?: any, state?: any) =>
                Parameters<TApiMethod[TPath]>;
    clearAtTheEnd: boolean;
}

// Logger
const debug = debug_("readium-desktop:api-decorator");

/**
 *
 * @param apiPath api pathname
 * @param refresh api pathname array
 * @param requestDataFct function that return request param
 * @param requestId request ID or Channel
 * @param clearAtTheEnd Boolean to clear data result in a destructor
 */
export function apiDecorator<
    TPath extends TApiMethodName
    >(
    apiPath: TPath,
    refresh?: TApiMethodName[],
    requestDataFct?: (reduxState?: TRootState, props?: any, state?: any) =>
        Parameters<TApiMethod[TPath]>,
    requestId: string = uuid.v4(),
    clearAtTheEnd: boolean = true,
) {
    return <
        // tslint:disable-next-line:callable-types
        T extends { new(...args: any[]): ReactComponent<Props, State, MapState, MapDispatch, TApiDecorator<TPath>> }
        , Props = {}
        , State = {}
        , MapState = {}
        , MapDispatch = {}
        ,
    >(component: T) =>
        class extends component {

            // should be private, but it is currently not possible in TS
            // https://github.com/Microsoft/TypeScript/issues/30355
            public storeUnsubscribeApi: Unsubscribe | undefined;

            public apiArray: Array<IApiDataInternal<TPath>>;

            public didMount: boolean;
            public willUnmount: boolean;

            constructor(...args: any[]) {
                super(...args);

                debug("apiPath", apiPath);

                this.didMount = false;
                this.willUnmount = false;

                if (!Array.isArray(this.apiArray)) {

                    this.storeUnsubscribeApi = undefined;

                    this.api = [] as unknown as TApiDecorator<TPath>;

                    this.apiArray = [];
                }

                const splitPath = apiPath.split("/");
                const moduleId = splitPath[0] as TModuleApi;
                const methodId = splitPath[1] as TMethodApi;

                this.apiArray.push({
                    moduleId,
                    methodId,
                    requestId,
                    apiPath,
                    refresh,
                    requestDataFct,
                    clearAtTheEnd,
                });

                const store = diRendererGet("store");
                const state = store.getState();

                this.api[apiPath] = {
                    request: (...requestData: Parameters<TApiMethod[TPath]>) =>
                        store.dispatch(
                            apiActions.request.build(requestId, moduleId, methodId, requestData)),
                    result: state.api[requestId],
                    needRefresh: false,
                };

                if (requestDataFct) {

                    const data = requestDataFct(state, this.props, this.state);
                    store.dispatch(apiActions.request.build(requestId, moduleId, methodId, data));
                }
            }

            public componentDidMount() {
                if (super.componentDidMount) {
                    super.componentDidMount();
                }

                if (!this.didMount) {

                    const store = diRendererGet("store");

                    this.storeUnsubscribeApi = store.subscribe(() => {
                        const state = store.getState();

                        this.apiArray.forEach((apiData) => {

                            const newApiResult = state.api[apiData.requestId];

                            if (!shallowEqual(newApiResult, this.api[apiData.apiPath].result)) {
                                this.api[apiData.apiPath].result = newApiResult;

                                if (this.api[apiData.apiPath].needRefresh) {
                                    this.api[apiData.apiPath].needRefresh = false;
                                }

                                this.forceUpdate();
                            }

                            if (Array.isArray(apiData.refresh)
                                && state.api[LAST_API_SUCCESS_ID]?.data.moduleId) {

                                const moduleId = state.api[LAST_API_SUCCESS_ID].data.moduleId;
                                const methodId = state.api[LAST_API_SUCCESS_ID].data.methodId;

                                if (refresh.includes(`${moduleId}/${methodId}` as TApiMethodName)
                                    && !this.api[apiData.apiPath].needRefresh) {

                                    this.api[apiData.apiPath].needRefresh = true;

                                    if (apiData.requestDataFct) {

                                        const data = requestDataFct(state, this.props, this.state);
                                        store.dispatch(
                                            apiActions.request.build(
                                                apiData.requestId
                                                , apiData.moduleId
                                                , apiData.methodId
                                                , data
                                                    ,
                                            ));
                                    } else {

                                        this.forceUpdate();
                                    }
                                }
                            }
                        });
                    });

                    this.didMount = true;
                }
            }

            public componentWillUnmount() {
                if (super.componentWillUnmount) {
                    super.componentWillUnmount();
                }

                if (this.storeUnsubscribeApi) {
                    this.storeUnsubscribeApi();
                }

                if (!this.willUnmount) {

                    const store = diRendererGet("store");

                    this.apiArray.filter(
                        (apiData) =>
                            apiData.clearAtTheEnd,
                    ).forEach(
                        (apiData) =>
                            store.dispatch(apiActions.clean.build(apiData.requestId)),
                    );

                    this.willUnmount = true;
                }
            }
        };
}
