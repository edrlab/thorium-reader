// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import "reflect-metadata";

import * as React from "react";
import { Provider } from "react-redux";
import DialogManager from "readium-desktop/renderer/components/dialog/DialogManager";
import ToastManager from "readium-desktop/renderer/components/toast/ToastManager";
import { lazyInject } from "readium-desktop/renderer/di";
import { diRendererSymbolTable } from "readium-desktop/renderer/diSymbolTable";
import { RootState } from "readium-desktop/renderer/redux/states";
import { Store } from "redux";

import Reader from "./Reader";

export default class App extends React.Component<{}, undefined> {

    @lazyInject(diRendererSymbolTable.store)
    private store: Store<RootState>;

    constructor(props: {}) {
        super(props);
    }

    public render(): React.ReactElement<{}> {
        return (
            <Provider store={ this.store }>
                <div>
                    <Reader/>
                    <DialogManager />
                    <ToastManager />
                </div>
            </Provider>
        );
    }
}
