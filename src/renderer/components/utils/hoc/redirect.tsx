// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { Redirect, RouteComponentProps, withRouter } from "react-router";

import { DisplayType, RouterLocationState } from "../displayType";

export interface IRedirectTarget {
    pathname: string;
    search?: string;
}

export interface IRedirectProps {
    redirect?: (target: IRedirectTarget) => void;
}

export interface IRedirectState {
    redirect: IRedirectTarget | null;
}

type TComponentConstructor<P> = React.ComponentClass<P> | React.StatelessComponent<P>;

export function withRedirect<Props>(WrappedComponent: TComponentConstructor<Props & IRedirectProps>) {

    const WrapperComponent = class extends
        React.Component<Props & IRedirectProps & RouteComponentProps, IRedirectState> {

        public static displayName: string;

        public constructor(props: Props & IRedirectProps & RouteComponentProps) {
            super(props);

            this.state = {
                redirect: null,
            };

            this.doRedirect = this.doRedirect.bind(this);
        }

        public doRedirect(target: IRedirectTarget) {
            this.setState({redirect: target});
        }

        public render() {

            if (this.state.redirect) {
                // hacky technique, but not sure how else?
                setTimeout(() => {
                    this.setState({redirect: null});
                }, 100);
            }

            const newProps: Props & IRedirectProps & RouteComponentProps = Object.assign(
                {},
                this.props,
                {
                    redirect: this.doRedirect,
                } as IRedirectProps,
            );

            let displayType = DisplayType.Grid;
            if (this.props.location?.state?.displayType) {
                displayType = this.props.location.state.displayType as DisplayType;
            }

            return (<>
                {this.state.redirect && <Redirect
                    push={true}
                    to={{
                        pathname: this.state.redirect.pathname,
                        search: this.state.redirect.search ?? "",
                        hash: "",
                        state: {
                            displayType,
                        } as RouterLocationState,
                }}/>}
                <WrappedComponent { ...newProps } />
            </>);
        }
    };

    WrapperComponent.displayName =
        `withRedirect(${WrappedComponent.displayName || WrappedComponent.name || "Component"})`;
    return withRouter(WrapperComponent);
}
