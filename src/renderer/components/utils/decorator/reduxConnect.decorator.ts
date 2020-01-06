// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ReactComponent } from "readium-desktop/renderer/components/utils/reactComponent";
import { diRendererGet } from "readium-desktop/renderer/di";
import { TRootState } from "readium-desktop/renderer/redux/reducers";
import { TDispatch } from "readium-desktop/typings/redux";
import { shallowEqual } from "readium-desktop/utils/shallowEqual";
import { Unsubscribe } from "redux";

export function reduxConnectDecorator<
    MapState extends { [key: string]: any } = {},
    MapDispatch extends { [key: string]: () => void } = {}
>(
    mapStateFct?: (state: TRootState, props?: any) => MapState,
    mapDispatchFct?: (dispatch: TDispatch, props?: any) => MapDispatch,
) {
    return <
        // tslint:disable-next-line:callable-types
        T extends { new(...args: any[]): ReactComponent<Props, State, MapState, MapDispatch> }
        , Props = {}
        , State = {}
    >(component: T) =>
        class extends component {

            // should be private, but it is currently not possible in TS
            // https://github.com/Microsoft/TypeScript/issues/30355
            public storeUnsubscribe: Unsubscribe | undefined;

            constructor(...args: any[]) {
                super(...args);

                this.storeUnsubscribe = undefined;

                const store = diRendererGet("store");

                if (mapStateFct) {
                    this.reduxState = mapStateFct(store.getState(), this.props);
                }

                if (mapDispatchFct) {
                    this.reduxDispatch = mapDispatchFct(store.dispatch, this.props);
                }
            }

            public componentDidMount() {
                if (super.componentDidMount) {
                    super.componentDidMount();
                }

                if (mapStateFct) {

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
