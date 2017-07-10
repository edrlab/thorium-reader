import * as React from "react";

import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton";
import Snackbar     from "material-ui/Snackbar";
import { lightBaseTheme, MuiThemeProvider } from "material-ui/styles";
import getMuiTheme from "material-ui/styles/getMuiTheme";

import { Store } from "redux";

import { Catalog } from "readium-desktop/models/catalog";
import { Publication } from "readium-desktop/models/publication";

import { lazyInject } from "readium-desktop/renderer/di";

import { setLocale } from "readium-desktop/actions/i18n";
import { Translator } from "readium-desktop/i18n/translator";

import { encodeURIComponent_RFC3986 } from "readium-desktop/utils/url";

import AppToolbar from "readium-desktop/renderer/components/AppToolbar";
import Library from "readium-desktop/renderer/components/Library";
import ReaderNYPL from "readium-desktop/renderer/components/ReaderNYPL";

import * as readerActions from "readium-desktop/renderer/actions/reader";
import * as windowActions from "readium-desktop/renderer/actions/window";
import { RendererState } from "readium-desktop/renderer/reducers";
import { ReaderStatus } from "readium-desktop/renderer/reducers/reader";

import * as publicationimportActions from "readium-desktop/actions/collection-manager";

import * as Dropzone from "react-dropzone";

import { Styles } from "readium-desktop/renderer/components/styles"

interface AppState {
    catalog: Catalog;
    readerOpen: boolean;
    openManifestUrl?: string;
    openPublication: Publication;
    snackbarOpen: boolean;
    dialogOpen: boolean;
}

const lightMuiTheme = getMuiTheme(lightBaseTheme);
const defaultLocale = "fr";

export default class App extends React.Component<undefined, AppState> {
    @lazyInject("store")
    private store: Store<RendererState>;

    @lazyInject("translator")
    private translator: Translator;

    private snackBarMessage: string = "";

    private dialogMessage: JSX.Element;

    private filesToImport: File[] = [];

    constructor() {
        super();
        let locale = this.store.getState().i18n.locale;

        if (locale == null) {
            this.store.dispatch(setLocale(defaultLocale));
        }

        this.translator.setLocale(locale);

        this.state = {
            catalog: undefined,
            readerOpen: false,
            openManifestUrl: undefined,
            openPublication: undefined,
            snackbarOpen: false,
            dialogOpen: false,
        };

        this.handleOpenPublication = this.handleOpenPublication.bind(this);
        this.handleClosePublication = this.handleClosePublication.bind(this);
    }

    public handleOpenPublication(publication: Publication) {
        this.store.dispatch(readerActions.init(publication));
    }

    public handleClosePublication() {
        this.store.dispatch(readerActions.close(
            this.state.openPublication,
            this.state.openManifestUrl,
            ),
        );
    }

    // Called when files are droped on the dropzone
    public onDrop(acceptedFiles: File[], rejectedFiles: File[]) {
        this.filesToImport = acceptedFiles;
        let nameList: JSX.Element[] = [];
        let i = 0;
        for (let file of acceptedFiles) {
            nameList.push (<li key={i}>{file.name}</li>);
            i++;
        }
        let message = (
            <div>
                <p>Etes vous sûr de vouloir importer ce(s) fichier(s) :</p>
                <ul>
                    {nameList}
                </ul>
            </div>
        );
        this.openDialog(message);
    }

    // Create the download list if it doesn't exist then start the download
    public importFiles = () => {
        for (let file of this.filesToImport)
        {
            this.store.dispatch(publicationimportActions.fileImport([file.path]));
        }

        this.openSnackbar("Les fichiers ont été importés avec succès.");
    }

    public componentDidMount() {
        this.store.dispatch(windowActions.init());
        this.store.subscribe(() => {
            const storeState = this.store.getState();
            const catalog = storeState.catalog;

            if (catalog.publications === undefined) {
                this.setState({catalog: undefined});
            } else {
                this.setState({catalog: {
                    title: "My Catalog",
                    publications: catalog.publications},
                });
            }

            this.setState({
                readerOpen: (storeState.reader.status === ReaderStatus.Open),
                openManifestUrl: storeState.reader.manifestUrl,
                openPublication: storeState.reader.publication,
            });

            this.translator.setLocale(this.store.getState().i18n.locale);
        });
    }

    public render(): React.ReactElement<{}> {
        const actions = [
            <FlatButton
                label="Oui"
                primary={true}
                onTouchTap={() => {
                    this.handleDialogClose();
                    this.importFiles();
                }}
            />,
            <FlatButton
                label="Non"
                primary={true}
                onTouchTap={() => {this.handleDialogClose(); }}
            />,
        ];

        return (
            <MuiThemeProvider muiTheme={lightMuiTheme}>
                <div>
                    {!this.state.readerOpen ? (
                    <Dropzone disableClick onDrop={this.onDrop.bind(this)} style={{Height: "98vh"}}>
                        <AppToolbar />
                        <Library
                            catalog={this.state.catalog}
                            handleRead={this.handleOpenPublication}
                            openSnackbar={this.openSnackbar.bind(this)}/>
                        <Snackbar
                            open={this.state.snackbarOpen}
                            message= {this.snackBarMessage}
                            autoHideDuration={4000}
                            onRequestClose={this.handleRequestClose}
                        />
                        <Dialog
                            actions={actions}
                            modal={false}
                            open={this.state.dialogOpen}
                            onRequestClose={this.handleDialogClose}
                            autoScrollBodyContent={true}
                            >
                            {this.dialogMessage}
                        </Dialog>
                    </Dropzone>
                    ) : (
                        <div>
                            <ReaderNYPL
                                manifestURL={ encodeURIComponent_RFC3986(this.state.openManifestUrl) }
                                handleClose={this.handleClosePublication} />
                        </div>
                    )}
                </div>
            </MuiThemeProvider>
        );
    }

    private openSnackbar(message: string) {
        this.snackBarMessage = message;
        this.setState({snackbarOpen: true});
    }

    private openDialog(message: JSX.Element) {
        this.dialogMessage = message;
        this.setState({dialogOpen: true});
    }

    private handleRequestClose = () => {
        this.setState({ snackbarOpen: false });
    }

    private handleDialogClose () {
        this.setState({ dialogOpen: false });
    }
}
