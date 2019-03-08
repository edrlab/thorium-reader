// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as uuid from "uuid";

import * as React from "react";

import { Store } from "redux";

import { connect } from "react-redux";

import { Translator } from "readium-desktop/common/services/translator";

import { container } from "readium-desktop/renderer/di";

import { RootState } from "readium-desktop/renderer/redux/states";

import { apiActions } from "readium-desktop/common/redux/actions";

import { ApiLastSuccess } from "readium-desktop/renderer/redux/states/api";

export interface ApiOperationDefinition {
    moduleId: string;
    methodId: string;
    callProp?: string;
    resultProp?: string;
    buildRequestData?: any;
    onLoad?: boolean; // Load in component did mount, default true
}

export interface ApiConfig {
    operations: ApiOperationDefinition[];
    refreshTriggers?: any; // Api operation that triggers a new refresh
    mapStateToProps?: any;
    mapDispatchToProps?: any;
}

export interface ApiOperationRequest {
    id: string;
    caller?: any;
    definition: ApiOperationDefinition;
}

export interface ApiProps {
    operationResults: any;
    requestOnLoadData?: any;
    cleanData?: any;
}

export function withApi(WrappedComponent: any, queryConfig: ApiConfig) {
    // Create operationRequests
    const operationRequests: ApiOperationRequest[] = [];
    const store = container.get("store") as Store<RootState>;

    for (const operation of queryConfig.operations) {
        const requestId = uuid.v4();

        // Create call method
        const caller = (props: any) => {
            return (requestData?: any) => {
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

    const mapDispatchToProps = (dispatch: any, ownProps: any) => {
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
                requestOnLoadData: (data: any) => {
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

    const mapStateToProps = (state: any, ownProps: any) => {
        let stateToPropsResult = {};

        if (queryConfig.mapStateToProps != null) {
            stateToPropsResult = queryConfig.mapStateToProps(
                state,
                ownProps,
            );
        }

        const operationResults: any = {};

        for (const operationRequest of operationRequests) {
            if (operationRequest.id in state.api.data) {
                const result = state.api.data[operationRequest.id].result;
                const resultProp = operationRequest.definition.resultProp;
                operationResults[resultProp] = result;
            }
        }

        return Object.assign(
            {},
            stateToPropsResult,
            operationResults,
        );
    };

    const BaseWrapperComponent = class extends React.Component<ApiProps, undefined> {
        private lastSuccess: ApiLastSuccess;
        private store: Store<RootState>;
        private stateUpdateUnsubscribe: any;

        constructor(props: any) {
            super(props);

            this.lastSuccess = null;
            this.handleStateUpdate = this.handleStateUpdate.bind(this);
        }

        public componentDidMount() {
            this.props.requestOnLoadData();
            this.store = container.get("store") as Store<RootState>;

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
            const translate = translator.translate.bind(translator);

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
                    newProps[key] = newProps.operationResults[key];
                }
            }

            for (const operationRequest of operationRequests) {
                const def = operationRequest.definition;
                newProps[def.callProp] = operationRequest.caller(this.props);
            }

            return (<WrappedComponent { ...newProps } />);
        }

        private handleStateUpdate() {
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

    return connect(mapStateToProps, mapDispatchToProps)(BaseWrapperComponent);
}
