// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { Store } from "redux";

import { History } from "history";

import { ConnectedRouter } from "connected-react-router";

import Dropzone from "react-dropzone";

import { RootState } from "readium-desktop/renderer/redux/states";

import { lazyInject } from "readium-desktop/renderer/di";

import PageManager from "readium-desktop/renderer/components/PageManager";

import { Provider } from "react-redux";

import DialogManager from "readium-desktop/renderer/components/dialog/DialogManager";

import * as dialogActions from "readium-desktop/common/redux/actions/dialog";

import { DialogType } from "readium-desktop/common/models/dialog";

import SameFileImportManager from "./utils/SameFileImportManager";

import ToastManager from "./toast/ToastManager";

import * as styles from "readium-desktop/renderer/assets/styles/app.css";

export default class App extends React.Component<any, undefined> {
    @lazyInject("store")
    private store: Store<RootState>;

    @lazyInject("history")
    private history: History;

    constructor(props: any) {
        super(props);

        this.onDrop = this.onDrop.bind(this);
    }

    // Called when files are droped on the dropzone
    public onDrop(acceptedFiles: File[]) {
        const tabfile: File[] = this.cleanTabFile(acceptedFiles);

        this.store.dispatch(
            dialogActions.open(
                DialogType.FileImport,
                {
                    files: tabfile.map((file) => {
                        return {
                            name: file.name,
                            path: file.path,
                        };
                    }),
                },
        ));
    }

    public cleanTabFile(files: File[]): File[] {
        const tab: File[] = [];

        files.map((file) => {
            if (file.name.search(".epub") !== -1 ||
                file.name.search(".opds") !== -1 ||
                file.name.search(".lcpl") !== -1) {
                    tab.push(file);
                }
            });
        return (tab);
    }

    public async componentDidMount() {
        window.document.documentElement.addEventListener("keydown", (ev: KeyboardEvent) => {
            window.document.documentElement.classList.add("R2_CSS_CLASS__KEYBOARD_INTERACT");
        }, true);
        window.document.documentElement.addEventListener("mousedown", (ev: MouseEvent) => {
            window.document.documentElement.classList.remove("R2_CSS_CLASS__KEYBOARD_INTERACT");
        }, true);
    }

    public render(): React.ReactElement<{}> {
        return (
            <Provider store={ this.store }>
                <ConnectedRouter history={ this.history }>
                    <div className={styles.root}>
                        <Dropzone
                            onDrop={ this.onDrop }
                        >
                            {({getRootProps, getInputProps}) => {
                                const rootProps = getRootProps({onClick: (e) => e.stopPropagation()});
                                rootProps.tabIndex = -1;
                                return <div
                                    {...rootProps}
                                    style={{
                                        position: "absolute",
                                        overflowX: "hidden",
                                        top: 124,
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                    }}
                                >
                                    <input aria-hidden {...getInputProps({onClick: (evt) => evt.preventDefault()})} />
                                    <PageManager/>
                                    <DialogManager />
                                    <SameFileImportManager />
                                    <ToastManager />
                                </div>;
                            }}
                        </Dropzone>
                    </div>
                </ConnectedRouter>
            </Provider>
        );
    }
}
