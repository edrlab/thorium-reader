// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { diRendererGet } from "readium-desktop/renderer/di";
import { TDispatch } from "readium-desktop/typings/redux";

export function reduxDispatchDecorator<MapDispatch extends { [key: string]: () => void } = {}>(
    mapDispatchFct: (dispatch: TDispatch, props?: any) => MapDispatch,
) {
    // tslint:disable-next-line:callable-types
    return <T extends { new(...args: any[]): React.Component<Props, State> }, Props = {}, State = {}>
        (component: T) =>
        class extends component {

            public reduxDispatch: MapDispatch;

            constructor(...args: any[]) {
                super(...args);

                const store = diRendererGet("store");
                this.reduxDispatch = mapDispatchFct(store.dispatch, this.props);
            }
        };
}
