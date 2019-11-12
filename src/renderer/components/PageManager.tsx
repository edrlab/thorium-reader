// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { Route, Switch } from "react-router-dom";
import { routes } from "readium-desktop/renderer/routing";

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
                {Object.keys(routes).map((path: string) => {
                    const route = (routes as any)[path];
                    return (
                        <Route
                            key={path}
                            exact={route.exact}
                            path={route.path}
                            component={route.component} />
                    );
                })}
            </Switch>
        );
    }
}
