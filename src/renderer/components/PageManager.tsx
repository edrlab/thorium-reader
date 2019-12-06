// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { Route, Switch } from "react-router-dom";
import { routes } from "readium-desktop/renderer/routing";
import { ObjectKeys } from "readium-desktop/utils/object-keys-values";

interface IState {
    activePage: number;
}

export default class PageManager extends React.Component<{}, IState> {

    constructor(props: {}) {
        super(props);

        this.state = {
            activePage: 0,
        };
    }

    public render(): React.ReactElement<{}> {
        return (
            <Switch>
                {
                    ObjectKeys(routes).map(
                        (path) =>
                            <Route
                                key={path}
                                exact={routes[path].exact}
                                path={routes[path].path}
                                component={routes[path].component}
                            />,
                    )
                }
            </Switch>
        );
    }
}
