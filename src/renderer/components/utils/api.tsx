import * as uuid from "uuid";

import * as React from "react";

import { connect } from "react-redux";

import { Translator } from "readium-desktop/common/services/translator";

import { container } from "readium-desktop/renderer/di";

import { apiActions } from "readium-desktop/common/redux/actions";

export interface ApiQueryConfig {
    moduleId: string;
    methodId: string;
    dstProp: string;
}

export interface ApiProps {
    requestId: any;
    data: any;
    requestData: any;
    cleanData: any;
}

export function withApi(WrappedComponent: any, queryConfig: ApiQueryConfig) {
    const mapDispatchToProps = (dispatch: any, ownProps: ApiProps) => {
        const { requestId } = ownProps;

        return {
            requestData: () => {
                dispatch(
                    apiActions.buildRequestAction(
                        requestId,
                        queryConfig.moduleId,
                        queryConfig.methodId,
                    ),
                );
            },
            cleanData: () => {
                dispatch(
                    apiActions.clean(requestId),
                );
            },
        };
    };

    const mapStateToProps = (state: any, ownProps: ApiProps) => {
        const { requestId } = ownProps;

        let data: any;

        if (requestId in state.api.data) {
            data = state.api.data[requestId].result;
        }

        return { data };
    };


    const BaseWrapperComponent = class extends React.Component<ApiProps, undefined> {
        constructor(props: any) {
            super(props);
        }

        componentDidMount() {
            this.props.requestData();
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

            newProps[queryConfig.dstProp] = newProps.data;
            return (<WrappedComponent { ...newProps } />);
        }
    };

    const WrapperComponent = connect(
        mapStateToProps,
        mapDispatchToProps
    )(BaseWrapperComponent);

    (WrapperComponent as any).defaultProps = {
        requestId: uuid.v4(),
    };

    return WrapperComponent;
}
