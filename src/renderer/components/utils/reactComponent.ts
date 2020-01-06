// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { I18nTyped } from "readium-desktop/common/services/translator";

// PureComponnent implement a shallow comparaison on props and state before the rendering decision
// I saw an excess of rendering on each component without extended PureComponent class

export class ReactComponent<
    P = {},
    S = {},
    ReduxState = {},
    ReduxDispatch = {},
    Api = {},
    > extends React.PureComponent<P, S> {

    public __: I18nTyped;
    public reduxState: Readonly<ReduxState>;
    public reduxDispatch: Readonly<ReduxDispatch>;
    public api: Api;
}
