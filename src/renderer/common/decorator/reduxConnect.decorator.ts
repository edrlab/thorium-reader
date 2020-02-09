// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { ReactBaseComponent } from "readium-desktop/renderer/common/ReactBaseComponent";
import { TRootState } from "readium-desktop/renderer/redux/reducers";
import { TDispatch } from "readium-desktop/typings/redux";
import { shallowEqual } from "readium-desktop/utils/shallowEqual";
import { Store, Unsubscribe } from "redux";

import { StoreContext } from "../../App";

export function reduxConnectDecorator<
    MapState extends { [key: string]: any } = {},
    MapDispatch extends { [key: string]: () => void } = {}
>(
    mapStateFct?: (state: TRootState, props?: any) => MapState,
    mapDispatchFct?: (dispatch: TDispatch, props?: any) => MapDispatch,
) {
    return <
        // tslint:disable-next-line:callable-types
        T extends { new(...args: any[]): ReactBaseComponent<Props, State, MapState, MapDispatch> }
        , Props = {}
        , State = {}
    >(component: T) => {
        const ret = class extends component {

            // should be private, but it is currently not possible in TS
            // https://github.com/Microsoft/TypeScript/issues/30355
            public _storeUnsubscribe: Unsubscribe | undefined;

            constructor(...args: any[]) {
                super(...args);

                this._storeUnsubscribe = undefined;
            }

            public componentDidMount() {
                if (super.componentDidMount) {
                    super.componentDidMount();
                }

                if (mapStateFct) {

                    this._storeUnsubscribe = this.store.subscribe(() => {
                        const state = this.store.getState();
                        const newReduxState = mapStateFct(state, this.props);

                        if (!shallowEqual(newReduxState, this.reduxState)) {
                            this.reduxState = newReduxState;

                            this.forceUpdate();
                        }
                    });
                }
            }

            public render() {

                const reduxInit = (store: Store<any>) => {

                    if (mapStateFct) {
                        this.reduxState = mapStateFct(store.getState(), this.props);
                    }

                    if (mapDispatchFct) {
                        this.reduxDispatch = mapDispatchFct(store.dispatch, this.props);
                    }
                };

                if (!this.store) {

                    return React.createElement(
                        StoreContext.Consumer,
                        null,
                        (store: Store<any>) => {

                            this.store = store;

                            reduxInit(store);
                            return super.render();
                        },
                    );
                }

                reduxInit(this.store);
                return super.render();
            }

            public componentWillUnmount() {
                if (super.componentWillUnmount) {
                    super.componentWillUnmount();
                }

                if (this._storeUnsubscribe) {
                    this._storeUnsubscribe();
                }
            }
        };

        Object.defineProperty(ret.prototype, "name", {
            value: component.name,
        });

        Object.defineProperty(ret, "name", {
            value: component.name,
        });

        return ret;
    };
}
