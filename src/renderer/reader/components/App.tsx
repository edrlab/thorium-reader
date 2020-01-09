// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import "reflect-metadata";

import * as React from "react";
import { Provider } from "react-redux";
import DialogManager from "readium-desktop/renderer/library/components/dialog/DialogManager";
import ToastManager from "readium-desktop/renderer/library/components/toast/ToastManager";
import { diReaderGet } from "readium-desktop/renderer/reader/di";

import Reader from "./Reader";

export default class App extends React.Component<{}, undefined> {

    constructor(props: {}) {
        super(props);
    }

    public render(): React.ReactElement<{}> {
        const store = diReaderGet("store");
        return (
            <Provider store={ store }>
                <div>
                    <Reader/>
                    <DialogManager />
                    <ToastManager />
                </div>
            </Provider>
        );
    }
}
