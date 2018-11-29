import * as uuid from "uuid";

import * as React from "react";

import { Store } from "redux";

import { connect } from "react-redux";

import { Translator } from "readium-desktop/common/services/translator";

import { container } from "readium-desktop/renderer/di";

import { RootState } from "readium-desktop/renderer/redux/states";

import { apiActions } from "readium-desktop/common/redux/actions";


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
            }
        )
    }

    const mapDispatchToProps = (dispatch: any, ownProps: any) => {
        let dispatchToPropsResult = {};

        if (queryConfig.mapDispatchToProps != null) {
            dispatchToPropsResult = queryConfig.mapDispatchToProps(
                dispatch,
                ownProps,
            );
        }

        // Create all dispatch methods
        for (const operationRequest of operationRequests) {
            // Generate the method to call
            if (!operationRequest.caller) {

            }
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
            }
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

        let operationResults: any = {};

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
        constructor(props: any) {
            super(props);
        }

        componentDidMount() {
            this.props.requestOnLoadData();
        }

        componentWillUnmount() {
            this.props.cleanData();
        }

        render() {
            const translator = container.get("translator") as Translator;
            const translate = translator.translate.bind(translator);

            const newProps: any = Object.assign(
                {},
                this.props,
                {
                    "__": translate,
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
    };

    return connect(mapStateToProps, mapDispatchToProps)(BaseWrapperComponent);
}
