import * as uuid from "uuid";

import * as React from "react";

import { connect } from "react-redux";

import { Translator } from "readium-desktop/common/services/translator";

import { container } from "readium-desktop/renderer/di";

import { apiActions } from "readium-desktop/common/redux/actions";


export interface ApiOperationDefinition {
    moduleId: string;
    methodId: string;
    callProp?: string;
    resultProp: string;
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

    for (const operation of queryConfig.operations) {
        // Create call method
        operationRequests.push(
            {
                id: uuid.v4(),
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
                operationRequest.caller = () => {
                    let requestData: any = null;
                    const def = operationRequest.definition;
                    const buildRequestData = def.buildRequestData;

                    if (buildRequestData) {
                        requestData = buildRequestData(ownProps);
                    }

                    dispatch(
                        apiActions.buildRequestAction(
                            operationRequest.id,
                            def.moduleId,
                            def.methodId,
                            requestData,
                        ),
                    );
                };
            }
        }

        return Object.assign(
            {},
            dispatchToPropsResult,
            {
                requestOnLoadData: (data: any) => {
                    for (const operationRequest of operationRequests) {
                        if (operationRequest.definition.onLoad) {
                            operationRequest.caller();
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

            return (<WrappedComponent { ...newProps } />);
        }
    };

    return connect(mapStateToProps, mapDispatchToProps)(BaseWrapperComponent);
}
