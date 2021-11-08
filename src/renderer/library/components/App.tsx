// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import "reflect-metadata";

import { ConnectedRouter } from "connected-react-router";
import * as path from "path";
import * as React from "react";
import Dropzone, { DropzoneRootProps } from "react-dropzone";
import { Provider } from "react-redux";
import { acceptedExtension } from "readium-desktop/common/extension";
import { DialogTypeName } from "readium-desktop/common/models/dialog";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import ToastManager from "readium-desktop/renderer/common/components/toast/ToastManager";
import { ensureKeyboardListenerIsInstalled } from "readium-desktop/renderer/common/keyboard";
import { TranslatorContext } from "readium-desktop/renderer/common/translator.context";
import { apiAction } from "readium-desktop/renderer/library/apiAction";
import DialogManager from "readium-desktop/renderer/library/components/dialog/DialogManager";
import PageManager from "readium-desktop/renderer/library/components/PageManager";
import { diLibraryGet } from "readium-desktop/renderer/library/di";

import DownloadsPanel from "./DownloadsPanel";
import LoaderMainLoad from "./LoaderMainLoad";
import * as styles from "readium-desktop/renderer/assets/styles/global.css";

export default class App extends React.Component<{}, undefined> {

    constructor(props: {}) {
        super(props);

        this.onDrop = this.onDrop.bind(this);
    }

    // Called when files are droped on the dropzone
    public onDrop(acceptedFiles: File[]) {
        const filez = acceptedFiles
            .filter(
                (file) => acceptedExtension(path.extname(file.path)),
            )
            .map(
                (file) => ({
                    name: file.name,
                    path: file.path,
                }),
            );
        if (filez.length <= 5) {
            const paths = filez.map((file) => {
                return file.path;
            });
            apiAction("publication/importFromFs", paths).catch((error) => {
                console.error("Error to fetch publication/importFromFs", error);
            });
            return;
        }
        const store = diLibraryGet("store");
        store.dispatch(
            dialogActions.openRequest.build(
                DialogTypeName.FileImport,
                {
                    files: filez,
                },
            ));
    }

    public async componentDidMount() {
        ensureKeyboardListenerIsInstalled();
    }

    public render(): React.ReactElement<{}> {
        const store = diLibraryGet("store");
        const history = diLibraryGet("history");
        const translator = diLibraryGet("translator");

        return (
            <Provider store={store} >
                <TranslatorContext.Provider value={translator}>
                    <ConnectedRouter history={history}>
                        <Dropzone
                            onDrop={this.onDrop}
                        >
                            {({ getRootProps, getInputProps }) => {
                                const rootProps = getRootProps({ onClick: (e) => e.stopPropagation() } as DropzoneRootProps);
                                rootProps.tabIndex = -1;
                                // FIXME : css in code
                                return <div
                                    {...rootProps}
                                    className={styles.dropzone}
                                >
                                    <DownloadsPanel />
                                    <input aria-hidden {
                                        ...getInputProps({ onClick: (evt) => evt.preventDefault() })
                                    }
                                    />
                                    <PageManager />
                                    <DialogManager />
                                    <LoaderMainLoad />
                                    <ToastManager />
                                </div>;
                            }}
                        </Dropzone>
                    </ConnectedRouter>
                </TranslatorContext.Provider>
            </Provider>
        );
    }
}
