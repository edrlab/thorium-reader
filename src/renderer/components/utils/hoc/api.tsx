// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect, MapDispatchToPropsFunction, MapStateToProps } from "react-redux";
import { apiActions } from "readium-desktop/common/redux/actions";
import { TMethodApi, TModuleApi } from "readium-desktop/main/di";
import { container } from "readium-desktop/renderer/di";
import { RootState } from "readium-desktop/renderer/redux/states";
import { ApiLastSuccess } from "readium-desktop/renderer/redux/states/api";
import { Store } from "redux";
import * as uuid from "uuid";

interface IApiOperation {
    moduleId: TModuleApi;
    methodId: TMethodApi;
}

export interface IApiOperationDefinition<Props> extends IApiOperation {
    callProp?: keyof Props;
    resultProp?: keyof Props;
    resultIsRejectProp?: keyof Props;
    buildRequestData?: (props: Props) => unknown[];
    onLoad?: boolean; // Load in component did mount, default false
}

export interface IApiConfig<Props> {
    operations: Array<IApiOperationDefinition<Props>>;
    refreshTriggers?: IApiOperation[]; // Api operation that triggers a new refresh
}

export interface IApiOperationRequest<Props> {
    id: string;
    caller?: (props: Props) => (...requestData: unknown[]) => void;
    definition: IApiOperationDefinition<Props>;
}

export interface IApiMapDispatchToProps {
    requestOnLoadData: () => void;
    cleanData?: () => void;
}

// tslint:disable-next-line: no-empty-interface
export interface ApiProps extends IApiMapDispatchToProps {}

type TComponentConstructor<P> = React.ComponentClass<P> | React.StatelessComponent<P>;

// TS4094: private members fail the TS compiler, because:
// returned type is ConnectedComponentClass<typeof BaseWrapperComponent, any>
// tslint:disable-next-line: max-line-length
export function withApi<Props>(WrappedComponent: TComponentConstructor<any>, queryConfig: IApiConfig<Props>) {

    // Create operationRequests
    const operationRequests: Array<IApiOperationRequest<Props>> = [];
    const store = container.get<Store<RootState>>("store");

    for (const operation of queryConfig.operations) {
        const requestId = uuid.v4();

        // Create call method
        const caller = (props: Props) => {
            return (...requestData: unknown[]) => {
                const buildRequestData = operation.buildRequestData;

                if (!requestData && buildRequestData) {
                    requestData = buildRequestData(props);
                }

                store.dispatch(
                    apiActions.buildRequestAction(
                        requestId,
                        operation.moduleId,
                        operation.methodId,
                        requestData,
                    ),
                );
            };
        };

        operationRequests.push(
            {
                id: requestId,
                caller,
                definition: Object.assign(
                    {},
                    // default value
                    {
                        callProp: uuid.v4(),
                        resultProp: uuid.v4(),
                        onLoad: false,
                    },
                    // add operationDefinition
                    operation,
                ),
            },
        );
    }

    const mapDispatchToProps: MapDispatchToPropsFunction<IApiMapDispatchToProps, any> = (dispatch, ownProps) => {
        return {
                requestOnLoadData: () => {
                    for (const operationRequest of operationRequests) {
                        if (operationRequest.definition.onLoad) {
                            operationRequest.caller(ownProps)();
                        }
                    }
                },
                cleanData: () => {
                    for (const operationRequest of operationRequests) {
                        dispatch(
                            apiActions.clean(operationRequest.id),
                        );
                    }
                },
            };
    };

    const mapStateToProps: MapStateToProps<Props, any, RootState> = (state) => {

        // typed with any because the return type of the function is fulfilled
        const operationResults: any = {};

        for (const operationRequest of operationRequests) {
            if (operationRequest.id in state.api.data) {
                const result = state.api.data[operationRequest.id].result;
                const resultProp = operationRequest.definition.resultProp;
                operationResults[resultProp] = result;

                const resultIsReject = state.api.data[operationRequest.id].resultIsReject;
                const resultIsRejectProp = operationRequest.definition.resultIsRejectProp;
                operationResults[resultIsRejectProp] = resultIsReject;
            }
        }

        return Object.assign(
            {},
            operationResults,
        );
    };

    const BaseWrapperComponent = class extends React.Component<any> {
        public static displayName: string;

        // Ideally should be private, but see TS4094 comments in this file
        /* private */ public lastSuccess: ApiLastSuccess;
        /* private */ public store: Store<RootState>;
        /* private */ public stateUpdateUnsubscribe: any;

        constructor(props: any) {
            super(props);

            this.lastSuccess = null;
            this.handleStateUpdate = this.handleStateUpdate.bind(this);
        }

        public componentDidMount() {
            this.props.requestOnLoadData();
            this.store = container.get<Store<RootState>>("store");

            if (queryConfig.refreshTriggers) {
                this.stateUpdateUnsubscribe = this.store.subscribe(this.handleStateUpdate);
            }
        }

        public componentWillUnmount() {
            if (this.stateUpdateUnsubscribe) {
                this.stateUpdateUnsubscribe();
            }

            this.props.cleanData();
        }

        public render() {
            const operationRequestProps: any = {};
            for (const operationRequest of operationRequests) {
                const def = operationRequest.definition;
                operationRequestProps[def.callProp] = operationRequest.caller(this.props);
            }

            // newProps become immutable from props (Readonly type)
            const newProps = Object.assign(
                {},
                this.props,
                operationRequestProps,
            );

            return (<WrappedComponent { ...newProps } />);
        }

        // Ideally should be private, but see TS4094 comments in this file
        /* private */ public handleStateUpdate() {
            const state = this.store.getState();
            const apiLastSuccess = state.api.lastSuccess;

            if (!apiLastSuccess) {
                return;
            }

            const lastSuccessDate = (this.lastSuccess && this.lastSuccess.date) || 0;

            if (apiLastSuccess.date <= lastSuccessDate) {
                return;
            }

            // New api success
            this.lastSuccess = apiLastSuccess;

            // Need to refresh the component
            const meta = apiLastSuccess.action.meta.api;

            const lastAction = {
                moduleId: meta.moduleId,
                methodId: meta.methodId,
            };

            let refresh = false;

            for (const triggerAction of queryConfig.refreshTriggers) {
                if (
                    triggerAction.moduleId === lastAction.moduleId
                    && triggerAction.methodId === lastAction.methodId
                ) {
                    refresh = true;
                    break;
                }
            }
            if (refresh) {
                this.props.requestOnLoadData();
            }
        }
    };

    BaseWrapperComponent.displayName =
        `withApi(${WrappedComponent.displayName || WrappedComponent.name || "Component"})`;

    return connect(mapStateToProps, mapDispatchToProps)(BaseWrapperComponent);
}
