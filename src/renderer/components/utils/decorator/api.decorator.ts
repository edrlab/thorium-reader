// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import * as React from "React";
import { apiActions } from "readium-desktop/common/redux/actions";
import { TApiMethod, TApiMethodName } from "readium-desktop/main/api/api.type";
import { TMethodApi, TModuleApi } from "readium-desktop/main/di";
import { ReactBaseComponent } from "readium-desktop/renderer/components/utils/ReactBaseComponent";
import { TRootState } from "readium-desktop/renderer/redux/reducers";
import { ApiResponse, LAST_API_SUCCESS_ID } from "readium-desktop/renderer/redux/states/api";
import { ReturnPromiseType } from "readium-desktop/typings/promise";
import { shallowEqual } from "readium-desktop/utils/shallowEqual";
import { Store, Unsubscribe } from "redux";
import * as uuid from "uuid";

import { StoreContext } from "../../App";

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
        T extends { new(...args: any[]): ReactBaseComponent<Props, State, MapState, MapDispatch, TApiDecorator<TPath>> }
        , Props = {}
        , State = {}
        , MapState = {}
        , MapDispatch = {}
        ,
        >(component: T) => {
        const ret = class extends component {

        // should be private, but it is currently not possible in TS
        // https://github.com/Microsoft/TypeScript/issues/30355
        // BUT check the release of this : https://github.com/microsoft/TypeScript/pull/30829
        // FIXME: when available replace _ by # and all inheriting class will not be abble to access this field
        public _storeUnsubscribeApi: Unsubscribe | undefined;

        public _apiArray: Array<IApiDataInternal<TPath>>;

        public _didMount: boolean;
        public _willUnmount: boolean;
        public _render: boolean;

        constructor(...args: any[]) {
            super(...args);

            debug("apiPath", apiPath);

            this._didMount = false;
            this._willUnmount = false;
            this._render = false;

            if (!Array.isArray(this._apiArray)) {

                this._storeUnsubscribeApi = undefined;

                // @ts-ignore
                this.api = [];

                this._apiArray = [];
            }

            const splitPath = apiPath.split("/");
            const moduleId = splitPath[0] as TModuleApi;
            const methodId = splitPath[1] as TMethodApi;

            this._apiArray.push({
                moduleId,
                methodId,
                requestId,
                apiPath,
                refresh,
                requestDataFct,
                clearAtTheEnd,
            });

        }

        public componentDidMount() {
            if (super.componentDidMount) {
                super.componentDidMount();
            }

            if (!this._didMount) {

                this._storeUnsubscribeApi = this.store.subscribe(() => {
                    const state = this.store.getState();

                    this._apiArray.forEach((apiData) => {

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
                                    this.store.dispatch(
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

                this._didMount = true;
            }
        }

        public render() {

            const apiInit = (store: Store<any>) => {
                const state = store.getState();

                this._apiArray.forEach((apiData) => {

                    this.api[apiData.apiPath] = {
                        request: (...requestData: Parameters<TApiMethod[TPath]>) =>
                            store.dispatch(
                                apiActions.request.build(
                                    apiData.requestId,
                                    apiData.moduleId,
                                    apiData.methodId,
                                    requestData,
                                ),
                            ),
                        result: state.api[requestId],
                        needRefresh: false,
                    };

                    if (requestDataFct) {

                        const data = requestDataFct(state, this.props, this.state);
                        store.dispatch(
                            apiActions.request.build(
                                apiData.requestId,
                                apiData.moduleId,
                                apiData.methodId,
                                data,
                            ),
                        );
                    }
                });
            };

            if (!this._render) {
                this._render = true;
                if (!this.store) {

                    return React.createElement(
                        StoreContext.Provider,
                        null,
                        (store: Store<any>) => {

                            this.store = store;

                            apiInit(store);
                            return super.render();
                        });
                }
                apiInit(this.store);
            }
            // already initialized, return render in parent
            return super.render();

        }

        public componentWillUnmount() {
            if (super.componentWillUnmount) {
                super.componentWillUnmount();
            }

            if (this._storeUnsubscribeApi) {
                this._storeUnsubscribeApi();
            }

            if (!this._willUnmount) {

                this._apiArray.filter(
                    (apiData) =>
                        apiData.clearAtTheEnd,
                ).forEach(
                    (apiData) =>
                        this.store.dispatch(apiActions.clean.build(apiData.requestId)),
                );

                this._willUnmount = true;
            }
        }
    };

        Object.defineProperty(ret.prototype, "name", {
            value: component.name,
        });

        Object.defineProperty(ret, "name", {
            value: component.name,
        });

        return ret;
    };
}
