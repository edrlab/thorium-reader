// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect, MapDispatchToPropsFunction, MapStateToProps } from "react-redux";
import { apiActions } from "readium-desktop/common/redux/actions";
import { I18nTyped, Translator } from "readium-desktop/common/services/translator";
import { container } from "readium-desktop/renderer/di";
import { RootState } from "readium-desktop/renderer/redux/states";
import { ApiLastSuccess } from "readium-desktop/renderer/redux/states/api";
import { Store } from "redux";
import * as uuid from "uuid";

import { ComponentClass, StatelessComponent } from "react";

export interface IApiOperationResult {
    [idx: string]: any;
}

interface IApiOperation {
    moduleId: string;
    methodId: string;
}

export interface IApiOperationDefinition extends IApiOperation {
    callProp?: string;
    resultProp?: string;
    resultIsRejectProp?: string;
    buildRequestData?: (props: any) => unknown[];
    onLoad?: boolean; // Load in component did mount, default true
}

export interface IApiConfig {
    operations: IApiOperationDefinition[];
    refreshTriggers?: IApiOperation[]; // Api operation that triggers a new refresh
    mapStateToProps?: MapStateToProps<RootState, any, any>;
    mapDispatchToProps?: MapDispatchToPropsFunction<any, any>;
}

export interface IApiOperationRequest {
    id: string;
    caller?: (props: any) => (...requestData: unknown[]) => void;
    definition: IApiOperationDefinition;
}

export interface IApiProps {
    operationResults?: IApiOperationResult;
    requestOnLoadData?: () => void;
    cleanData?: () => void;
}

type TComponentConstructor<P> = ComponentClass<P> | StatelessComponent<P>;

// TS4094: private members fail the TS compiler, because:
// returned type is ConnectedComponentClass<typeof BaseWrapperComponent, any>
// tslint:disable-next-line: max-line-length
export function withApi<Props>(WrappedComponent: TComponentConstructor<Props & IApiProps>, queryConfig: IApiConfig) {

    // Create operationRequests
    const operationRequests: IApiOperationRequest[] = [];
    const store = container.get<Store<RootState>>("store");

    for (const operation of queryConfig.operations) {
        const requestId = uuid.v4();

        // Create call method
        const caller = (props: any) => {
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
                    {
                        callProp: uuid.v4(),
                        resultProp: uuid.v4(),
                        onLoad: false,
                    },
                    operation,
                ),
            },
        );
    }

    const mapDispatchToProps: MapDispatchToPropsFunction<any, any> = (dispatch, ownProps) => {
        let dispatchToPropsResult = {};

        if (queryConfig.mapDispatchToProps != null) {
            dispatchToPropsResult = queryConfig.mapDispatchToProps(
                dispatch,
                ownProps,
            );
        }

        return Object.assign(
            {},
            dispatchToPropsResult,
            {
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
            },
        );
    };

    const mapStateToProps: MapStateToProps<any, any, RootState> = (state, ownProps) => {
        let stateToPropsResult = {};

        if (queryConfig.mapStateToProps != null) {
            stateToPropsResult = queryConfig.mapStateToProps(
                state,
                ownProps,
            );
        }

        const operationResults: IApiOperationResult = {};

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
            stateToPropsResult,
            operationResults,
        );
    };

    const BaseWrapperComponent = class extends React.Component<IApiProps> {
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
            const translator = container.get("translator") as Translator;
            const translate = translator.translate.bind(translator) as I18nTyped;

            const newProps: any = Object.assign(
                {},
                this.props,
                {
                    __: translate,
                    translator,
                },
            );

            if (newProps.operationResults) {
                for (const key in newProps.operationResults) {
                    if (newProps.operationResults.hasOwnProperty(key)) {
                        newProps[key] = newProps.operationResults[key];
                    }
                }
            }

            for (const operationRequest of operationRequests) {
                const def = operationRequest.definition;
                newProps[def.callProp] = operationRequest.caller(this.props);
            }

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
