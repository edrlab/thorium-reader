// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

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
        result: Readonly<ApiResponse<ReturnPromiseType<TApiMethod[T]>>>;
        needRefresh: boolean
    };
};

export function apiDecorator<
    TPath extends TApiMethodName
    >(
    apiPath: TPath,
    refresh?: TApiMethodName[],
    requestDataFct?: (reduxState?: TRootState, props?: any, state?: any) =>
        Parameters<TApiMethod[TPath]>,
    requestId: string = uuid.v4(),
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
            public storeUnsubscribe: Unsubscribe | undefined;

            public moduleId: TModuleApi;
            public methodId: TMethodApi;
            public requestId: string;
            public apiPath: TPath;
            public refresh: TApiMethodName[];
            public requestDataFct: (reduxState?: TRootState, props?: any, state?: any) =>
                Parameters<TApiMethod[TPath]>;

            constructor(...args: any[]) {
                super(...args);

                this.storeUnsubscribe = undefined;

                const store = diRendererGet("store");

                this.requestId = requestId;
                this.apiPath = apiPath;
                this.refresh = refresh;
                this.requestDataFct = requestDataFct;

                const splitPath = this.apiPath.split("/");
                this.moduleId = splitPath[0] as TModuleApi;
                this.methodId = splitPath[1] as TMethodApi;

                const state = store.getState();

                if (!Array.isArray(this.api)) {
                    this.api = new Array() as unknown as TApiDecorator<TPath>;
                }

                this.api[this.apiPath] = {
                    request: (...requestData: Parameters<TApiMethod[TPath]>) =>
                        store.dispatch(
                            apiActions.request.build(this.requestId, this.moduleId, this.methodId, requestData)),
                    result: state.api[requestId],
                    needRefresh: false,
                };

                if (this.requestDataFct) {

                    const data = requestDataFct(state, this.props, this.state);
                    store.dispatch(apiActions.request.build(this.requestId, this.moduleId, this.methodId, data));
                }

            }

            public componentDidMount() {
                if (super.componentDidMount) {
                    super.componentDidMount();
                }

                const store = diRendererGet("store");

                this.storeUnsubscribe = store.subscribe(() => {
                    const state = store.getState();
                    const newApiResult = state.api[this.requestId];

                    if (!shallowEqual(newApiResult, this.api[apiPath].result)) {
                        this.api[apiPath].result = newApiResult;

                        if (this.api[apiPath].needRefresh) {
                            this.api[apiPath].needRefresh = false;
                        }

                        this.forceUpdate();
                    }

                    const moduleId = state.api[LAST_API_SUCCESS_ID].data.moduleId;
                    const methodId = state.api[LAST_API_SUCCESS_ID].data.methodId;

                    if (
                        Array.isArray(this.refresh)
                        && state.api[LAST_API_SUCCESS_ID]?.data.moduleId
                        && refresh.includes(`${moduleId}/${methodId}` as TApiMethodName)
                    ) {

                        if (this.requestDataFct) {

                            const data = requestDataFct(state, this.props, this.state);
                            store.dispatch(
                                apiActions.request.build(this.requestId, this.moduleId, this.methodId, data));

                        } else if (!this.api[apiPath].needRefresh) {

                            this.api[apiPath].needRefresh = true;
                            this.forceUpdate();
                        }
                    }
                });
            }

            public componentWillUnmount() {
                if (super.componentWillUnmount) {
                    super.componentWillUnmount();
                }

                if (this.storeUnsubscribe) {
                    this.storeUnsubscribe();
                }

                const store = diRendererGet("store");
                store.dispatch(apiActions.clean.build(this.requestId));
            }
        };
}
