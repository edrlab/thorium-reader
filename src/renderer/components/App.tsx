import * as React from "react";

import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton";
import Snackbar     from "material-ui/Snackbar";
import { lightBaseTheme, MuiThemeProvider } from "material-ui/styles";
import getMuiTheme from "material-ui/styles/getMuiTheme";

import { Store } from "redux";

import { Catalog } from "readium-desktop/models/catalog";
import { OPDS } from "readium-desktop/models/opds";
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
import { MessageStatus } from "readium-desktop/renderer/reducers/message";
import { ReaderStatus } from "readium-desktop/renderer/reducers/reader";

import * as publicationimportActions from "readium-desktop/actions/collection-manager";
import * as messageAction from "readium-desktop/renderer/actions/message";

import * as Dropzone from "react-dropzone";

interface AppState {
    catalog: Catalog;
    readerOpen: boolean;
    openManifestUrl?: string;
    openPublication: Publication;
    snackbarOpen: boolean;
    dialogOpen: boolean;
    opdsList: OPDS[];
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

    private currentDialogAction: JSX.Element[];

    private confimationAction: Function;

    private defaultDialogActions = [
        <FlatButton
            label="Oui"
            primary={true}
            onTouchTap={() => {
                this.handleDialogClose();
                if (this.confimationAction) {
                    this.confimationAction();
                } else {
                    this.importFiles();
                }
            }}
        />,
        <FlatButton
            label="Non"
            primary={true}
            onTouchTap={() => {this.handleDialogClose(); }}
        />,
    ];

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
            opdsList: undefined,
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
                <p>{this.translator.translate("dialog.import")}</p>
                <ul>
                    {nameList}
                </ul>
            </div>
        );
        this.openImportDialog(message);
    }

    // Create the download list if it doesn't exist then start the download
    public importFiles = () => {
        for (let file of this.filesToImport)
        {
            this.store.dispatch(publicationimportActions.fileImport([file.path]));
        }
    }

    public componentDidMount() {
        this.store.dispatch(windowActions.init());
        this.store.subscribe(() => {
            const storeState = this.store.getState();
            const catalog = storeState.catalog;
            const opds = storeState.opds;

            if (catalog.publications === undefined) {
                this.setState({catalog: undefined});
            } else {
                this.setState({catalog: {
                    title: "My Catalog",
                    publications: catalog.publications},
                });
            }
            if (storeState.message.status === MessageStatus.Open && this.state.snackbarOpen === false) {
                this.openSnackbar(storeState.message.messages[0]);

                this.setState({ snackbarOpen: (storeState.message.status === MessageStatus.Open) });
            }

            this.setState({
                readerOpen: (storeState.reader.status === ReaderStatus.Open),
                openManifestUrl: storeState.reader.manifestUrl,
                openPublication: storeState.reader.publication,
                opdsList: opds.opds,
            });

            this.translator.setLocale(this.store.getState().i18n.locale);
        });
    }

    public render(): React.ReactElement<{}> {
        return (
            <MuiThemeProvider muiTheme={lightMuiTheme}>
                <div>
                    {!this.state.readerOpen ? (
                    <Dropzone disableClick onDrop={this.onDrop.bind(this)} style={{}}>
                        <AppToolbar
                            openDialog={this.openDialog.bind(this)}
                            closeDialog={this.handleDialogClose.bind(this)}
                            opdsList={this.state.opdsList}/>
                        <Library
                            catalog={this.state.catalog}
                            handleRead={this.handleOpenPublication}
                            openSnackbar={this.openSnackbar.bind(this)}
                            openDialog={this.openDialog.bind(this)}/>
                        <Snackbar
                            open={this.state.snackbarOpen}
                            message= {this.snackBarMessage}
                            autoHideDuration={4000}
                            onRequestClose={this.handleRequestClose}
                        />
                        <Dialog
                            actions={this.currentDialogAction}
                            modal={false}
                            open={this.state.dialogOpen}
                            onRequestClose={this.handleDialogClose.bind(this)}
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
        if (!this.state.snackbarOpen) {
            this.snackBarMessage = message;
            this.setState({snackbarOpen: true});
        }
    }

    private openImportDialog (message: JSX.Element) {
        this.openDialog(message);
    }

    private openDialog(message: JSX.Element, confirmationAction?: Function, actions?: JSX.Element[]) {
        this.confimationAction = confirmationAction;

        if (actions) {
            this.currentDialogAction = actions;
        } else {
            this.currentDialogAction = this.defaultDialogActions;
        }
        this.dialogMessage = message;
        this.setState({dialogOpen: true});
    }

    private handleRequestClose = (reason: string) => {
        if (reason === "timeout") {
            this.setState({ snackbarOpen: false });
            this.store.dispatch(messageAction.purge());

            if (this.store.getState().message.messages.length > 0) {
                this.openSnackbar(this.store.getState().message.messages[0]);
            }
        }
    }

    private handleDialogClose () {
        this.setState({ dialogOpen: false });
    }
}
