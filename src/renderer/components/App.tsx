import * as React from "react";

import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton";
import Snackbar from "material-ui/Snackbar";
import { lightBaseTheme, MuiThemeProvider } from "material-ui/styles";
import getMuiTheme from "material-ui/styles/getMuiTheme";

import { Store } from "redux";

import { Catalog } from "readium-desktop/common/models/catalog";
import { OPDS } from "readium-desktop/common/models/opds";
import { Publication } from "readium-desktop/common/models/publication";

import { lazyInject } from "readium-desktop/renderer/di";

import { setLocale } from "readium-desktop/common/redux/actions/i18n";
import { Translator } from "readium-desktop/common/services/translator";

import { encodeURIComponent_RFC3986 } from "readium-desktop/utils/url";

import AppToolbar from "readium-desktop/renderer/components/AppToolbar";
import Library from "readium-desktop/renderer/components/Library";

import * as windowActions from "readium-desktop/renderer/actions/window";

import * as AppStyles from "readium-desktop/renderer/assets/styles/app.css";

import {
    catalogActions,
    readerActions,
} from "readium-desktop/common/redux/actions";

import { MessageStatus } from "readium-desktop/renderer/reducers/message";
import { RootState } from "readium-desktop/renderer/redux/states";
// import { ReaderStatus } from "readium-desktop/renderer/reducers/reader";

import * as messageAction from "readium-desktop/renderer/actions/message";

import * as Dropzone from "react-dropzone/dist";
// import { default as Dropzone } from "react-dropzone";
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

    private snackBarMessage: string = "";

    private dialogMessage: JSX.Element;

    private filesToImport: File[] = [];
    private filesLCPToImport: File[] = [];

    private currentDialogAction: JSX.Element[];

    private confimationAction: () => void;

    private defaultDialogActions = [
        <FlatButton
            label="Oui"
            primary={true}
            onClick={() => {
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
            onClick={() => {this.handleDialogClose(); }}
        />,
    ];

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
        // this.handleClosePublication = this.handleClosePublication.bind(this);
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
            console.log(file);
            if  (ext === "epub") {
                this.filesToImport.push(file);
                nameList.push (<li key={i}>{file.name}</li>);
            } else if (ext === "lcpl") {
                lcpList.push (<li key={i}>{file.name}</li>);
                this.filesLCPToImport.push(file);
            }
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
            </div>
        );
        this.openImportDialog(message);
    }

    // Create the download list if it doesn't exist then start the download
    public importFiles = () => {
        // FIXME: dead code
        for (const file of this.filesToImport) {
            this.store.dispatch(catalogActions.importLocalPublication(file.path));
        }
        for (const file of this.filesLCPToImport) {
            this.store.dispatch(catalogActions.importLocalLCPFile(file.path));
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
            if (storeState.message.status === MessageStatus.Open && this.state.snackbarOpen === false) {
                this.openSnackbar(storeState.message.messages[0]);

                this.setState({ snackbarOpen: (storeState.message.status === MessageStatus.Open) });
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
            <MuiThemeProvider muiTheme={lightMuiTheme}>
                <div className={AppStyles.root}>
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

    private openImportDialog(message: JSX.Element) {
        this.openDialog(message);
    }

    private openDialog(message: JSX.Element, confirmationAction?: () => void, actions?: JSX.Element[]) {
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

    private handleDialogClose() {
        this.setState({ dialogOpen: false });
    }
}
