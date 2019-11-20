// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import "reflect-metadata";

import { ConnectedRouter } from "connected-react-router";
import { History } from "history";
import * as path from "path";
import * as React from "react";
import Dropzone from "react-dropzone";
import { Provider } from "react-redux";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import * as styles from "readium-desktop/renderer/assets/styles/app.css";
import DialogManager from "readium-desktop/renderer/components/dialog/DialogManager";
import PageManager from "readium-desktop/renderer/components/PageManager";
import { lazyInject } from "readium-desktop/renderer/di";
import { RootState } from "readium-desktop/renderer/redux/states";
import { Store } from "redux";

import { diRendererSymbolTable } from "../diSymbolTable";
import DownloadsPanel from "./DownloadsPanel";
import ToastManager from "./toast/ToastManager";
import SameFileImportManager from "./utils/SameFileImportManager";

export default class App extends React.Component<{}, undefined> {

    @lazyInject(diRendererSymbolTable.store)
    private store: Store<RootState>;

    @lazyInject(diRendererSymbolTable.history)
    private history: History;

    constructor(props: {}) {
        super(props);

        this.onDrop = this.onDrop.bind(this);
    }

    // Called when files are droped on the dropzone
    public onDrop(acceptedFiles: File[]) {
        this.store.dispatch(
            dialogActions.openRequest.build("file-import",
                {
                    files: acceptedFiles.filter((file) => {
                            const ext = path.extname(file.path);
                            return (/\.epub[3]?$/.test(ext) ||
                            ext === ".lcpl");
                    })
                        .map((file) => {
                            return {
                                name: file.name,
                                path: file.path,
                            };
                        }),
                },
            ));
    }

    public async componentDidMount() {
        window.document.documentElement.addEventListener("keydown", (_ev: KeyboardEvent) => {
            window.document.documentElement.classList.add("R2_CSS_CLASS__KEYBOARD_INTERACT");
        }, true);
        window.document.documentElement.addEventListener("mousedown", (_ev: MouseEvent) => {
            window.document.documentElement.classList.remove("R2_CSS_CLASS__KEYBOARD_INTERACT");
        }, true);
    }

    public render(): React.ReactElement<{}> {
        return (
            <Provider store={this.store} >
                <ConnectedRouter history={this.history}>
                    <div className={styles.root}>
                        <Dropzone
                            onDrop={this.onDrop}
                        >
                            {({ getRootProps, getInputProps }) => {
                                const rootProps = getRootProps({ onClick: (e) => e.stopPropagation() });
                                rootProps.tabIndex = -1;
                                // FIXME : css in code
                                return <div
                                    {...rootProps}
                                    style={{
                                        position: "absolute",
                                        overflow: "hidden",
                                        top: 0,
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                    }}
                                >
                                    <DownloadsPanel/>
                                    <input aria-hidden {...getInputProps({onClick: (evt) => evt.preventDefault()})} />
                                    <PageManager/>
                                    <DialogManager/>
                                    <SameFileImportManager/>
                                    <ToastManager/>
                                </div>;
                            }}
                        </Dropzone>
                    </div>
                </ConnectedRouter>
            </Provider>
        );
    }
}
