// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { I18nTyped } from "readium-desktop/common/services/translator";
import { Store } from "redux";

// PureComponnent implement a shallow comparison on props and state before the rendering decision
// I saw an excess of rendering on each component if not extended with PureComponent class
// may be fixed with shouldComponentUpdate otherwise

export class ReactBaseComponent<
    ReactProps = {},
    ReactState = {},
    ReduxState = {},
    ReduxDispatch = {},
    Api = {},
    ReduxStoreState = {}
    > extends React.PureComponent<ReactProps, ReactState> {

    public __: I18nTyped;
    public reduxState: Readonly<ReduxState>;
    public reduxDispatch: Readonly<ReduxDispatch>;
    public api: Api | undefined;
    public store: Store<ReduxStoreState>;

    constructor(props: ReactProps, ...args: any[]) {
        super(props, ...args);

        this.__ = undefined;
        this.reduxState = undefined;
        this.reduxDispatch = undefined;
        this.api = undefined;
        this.store = undefined
    }
}
