// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { HashRouter  } from "react-router-dom";

import { lightBaseTheme } from "material-ui/styles";
import getMuiTheme from "material-ui/styles/getMuiTheme";

import { Store } from "redux";

import { Catalog } from "readium-desktop/common/models/catalog";
import { OPDS } from "readium-desktop/common/models/opds";
import { Publication } from "readium-desktop/common/models/publication";

import { lazyInject } from "readium-desktop/renderer/di";

import { Translator } from "readium-desktop/common/services/translator";

import * as windowActions from "readium-desktop/renderer/actions/window";

import * as AppStyles from "readium-desktop/renderer/assets/styles/app.css";

import {
    catalogActions,
    readerActions,
} from "readium-desktop/common/redux/actions";

import { RootState } from "readium-desktop/renderer/redux/states";

import * as Dropzone from "react-dropzone/dist";

import PageManager from "readium-desktop/renderer/components/PageManager";

import { Provider } from "react-redux";

import Dialog from "readium-desktop/renderer/components/utils/Dialog";

// does not work when "react-dropzone" is external to the bundle (Node require() import)

interface AppState {
    catalog: Catalog;
    // readerOpen: boolean;
    // openManifestUrl?: string;
    // openPublication: Publication;
    snackbarOpen: boolean;
    dialogOpen: boolean;
    opdsList: OPDS[];
    locale: string;
}

const lightMuiTheme = getMuiTheme(lightBaseTheme);
const defaultLocale = "fr";

export default class App extends React.Component<undefined, AppState> {
    @lazyInject("store")
    private store: Store<RootState>;

    @lazyInject("translator")
    private translator: Translator;

    private filesToImport: File[] = [];

    private confimationAction: () => void;

    private dialogMessage: JSX.Element;

    constructor(props: any) {
        super(props);
        const locale = this.store.getState().i18n.locale;

        this.state = {
            catalog: undefined,
            // readerOpen: false,
            // openManifestUrl: undefined,
            // openPublication: undefined,
            snackbarOpen: false,
            dialogOpen: false,
            opdsList: undefined,
            locale,
        };

        this.handleOpenPublication = this.handleOpenPublication.bind(this);
        this.handleDialogClose = this.handleDialogClose.bind(this);
    }

    public handleOpenPublication(publication: Publication) {
        this.store.dispatch(readerActions.open(publication));
    }

    // public handleClosePublication() {
    //     this.store.dispatch(readerActions.close(
    //         this.state.openPublication,
    //         this.state.openManifestUrl,
    //         ),
    //     );
    // }

    // Called when files are droped on the dropzone
    public onDrop(acceptedFiles: File[], rejectedFiles: File[]) {
        this.filesToImport = [];
        const nameList: JSX.Element[] = [];
        const lcpList: JSX.Element[] = [];
        let i = 0;
        for (const file of acceptedFiles) {
            const nameTab = file.name.split(".");
            const ext = nameTab[nameTab.length - 1];
            this.filesToImport.push(file);
            nameList.push (<li key={i}>{file.name}</li>);
            i++;
        }
        const message = (
            <div>
                {nameList.length > 0 && (
                    <div>
                        <p>{this.translator.translate("dialog.import")}</p>
                        <ul>
                            {nameList}
                        </ul>
                    </div>
                )}
                {lcpList.length > 0 && (
                    <div>
                        <p>{this.translator.translate("dialog.lcpImport")}</p>
                        <ul>
                            {lcpList}
                        </ul>
                    </div>
                )}
                <button
                    onClick={() => {
                        this.handleDialogClose();
                        if (this.confimationAction) {
                            this.confimationAction();
                        } else {
                            this.importFiles();
                        }
                    }}
                > Oui </button>
                <button
                    onClick={() => {this.handleDialogClose(); }}
                > Non </button>
            </div>
        );

        this.dialogMessage = message;
        this.setState({dialogOpen: true});
    }

    // Create the download list if it doesn't exist then start the download
    public importFiles = () => {
        // FIXME: dead code
        for (const file of this.filesToImport) {
            this.store.dispatch(catalogActions.importFile(file.path));
        }
    }

    public componentDidMount() {
        this.store.dispatch(windowActions.init());
        this.store.subscribe(() => {
            const storeState = this.store.getState();
            const catalog = storeState.catalog;
            const opdsState = storeState.opds;
            const i18nState = storeState.i18n;

            if (catalog.publications === undefined) {
                this.setState({catalog: undefined});
            } else {
                this.setState({catalog: {
                    title: "My Catalog",
                    publications: catalog.publications},
                });
            }

            this.translator.setLocale(i18nState.locale);
            this.setState({
                locale: i18nState.locale,
                // readerOpen: (storeState.reader.status === ReaderStatus.Open),
                // openManifestUrl: storeState.reader.manifestUrl,
                // openPublication: storeState.reader.publication,
                opdsList: opdsState.items,
            });
        });
    }

    public render(): React.ReactElement<{}> {
        return (
            <Provider store={this.store}>
                <HashRouter >
                    <div className={AppStyles.root}>
                        <Dropzone disableClick onDrop={this.onDrop.bind(this)} style={{
                            position: "absolute",
                            top: 0,
                            bottom: 0,
                            left: 0,
                            right: 0,
                        }}>
                            <PageManager/>
                            {/* <AppToolbar
                                openDialog={this.openDialog.bind(this)}
                                closeDialog={this.handleDialogClose.bind(this)}
                                opdsList={this.state.opdsList}/>
                            <Library
                                catalog={this.state.catalog}
                                handleRead={this.handleOpenPublication}
                                openSnackbar={this.openSnackbar.bind(this)}
                                openDialog={this.openDialog.bind(this)}/> */}
                            {/* <Snackbar
                                open={this.state.snackbarOpen}
                                message= {this.snackBarMessage}
                                autoHideDuration={4000}
                                onRequestClose={this.handleRequestClose}
                            />*/}
                            <Dialog
                                open={this.state.dialogOpen}
                                close={this.handleDialogClose}
                            >
                                {this.dialogMessage}
                            </Dialog>
                        </Dropzone>
                    </div>
                </HashRouter >
            </Provider>
        );
    }

    private handleDialogClose() {
        this.setState({ dialogOpen: false });
    }
}
