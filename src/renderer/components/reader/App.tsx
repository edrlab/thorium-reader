// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { Store } from "redux";

import { RootState } from "readium-desktop/renderer/redux/states";

import { lazyInject } from "readium-desktop/renderer/di";

import { Provider } from "react-redux";

import Reader from "./Reader";

import DialogManager from "readium-desktop/renderer/components/dialog/DialogManager";

export default class App extends React.Component<any, undefined> {
    @lazyInject("store")
    private store: Store<RootState>;

    public render(): React.ReactElement<{}> {
        return (
            <Provider store={ this.store }>
                <div>
                    <Reader/>
                    <DialogManager />
                </div>
            </Provider>
        );
    }
}
