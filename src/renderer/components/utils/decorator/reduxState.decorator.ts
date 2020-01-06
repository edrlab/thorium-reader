// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { diRendererGet } from "readium-desktop/renderer/di";
import { RootState } from "readium-desktop/renderer/redux/states";
import { shallowEqual } from "readium-desktop/utils/shallowEqual";
import { Unsubscribe } from "redux";

export function reduxStateDecorator<MapState extends { [key: string]: any } = {}>(
    mapStateFct: (state: RootState, props?: any) => MapState,
    ) {
    // tslint:disable-next-line:callable-types
    return <T extends { new(...args: any[]): React.Component<Props, State> }, Props = {}, State = {}>(component: T) =>
        class extends component {

            public reduxState: MapState;

            // should be private, but it is currently not possible in TS
            // https://github.com/Microsoft/TypeScript/issues/30355
            public storeUnsubscribe: Unsubscribe;

            constructor(...args: any[]) {
                super(...args);

                const store = diRendererGet("store");
                this.reduxState = mapStateFct(store.getState(), this.props);
            }

            public componentDidMount() {
                if (super.componentWillMount) {
                    super.componentWillMount();
                }

                const store = diRendererGet("store");
                this.storeUnsubscribe = store.subscribe(() => {
                    const state = store.getState();
                    const newReduxState = mapStateFct(state, this.props);

                    if (!shallowEqual(newReduxState, this.reduxState)) {
                        this.reduxState = newReduxState;
                        this.forceUpdate();
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
            }
        };
}
