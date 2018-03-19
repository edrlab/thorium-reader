import * as React from "react";

import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton";
import FontIcon from "material-ui/FontIcon";
import IconButton from "material-ui/IconButton";
import RaisedButton from "material-ui/RaisedButton";
import { blue500 } from "material-ui/styles/colors";
import TextField from "material-ui/TextField";

import { Store } from "redux";

import {
    catalogActions,
    lcpActions,
    publicationDownloadActions,
} from "readium-desktop/common/redux/actions";

import { Publication } from "readium-desktop/common/models/publication";

import { getMultiLangString } from "readium-desktop/common/models/language";

import { lazyInject } from "readium-desktop/renderer/di";
import { RootState } from "readium-desktop/renderer/redux/states";

import { Translator } from "readium-desktop/common/services/translator";

import { Catalog } from "readium-desktop/common/models/catalog";

import { UserKeyCheckStatus } from "readium-desktop/common/models/lcp";

import * as classNames from "classnames";
import EyeIcon from "readium-desktop/renderer/assets/icons/eye.svg";
import CardIcon from "readium-desktop/renderer/assets/icons/view-card.svg";
import ListIcon from "readium-desktop/renderer/assets/icons/view-list.svg";
import * as LibraryStyles from "readium-desktop/renderer/assets/styles/library.css";

import { PublicationCard, PublicationListElement } from "readium-desktop/renderer/components/Publication/index";

import { Styles } from "readium-desktop/renderer/components/styles";

interface ILibraryState {
    list: boolean;
    currentPublication: Publication;
    lcpPassOpen: boolean;
    lcpPass: string;
    lcpPassVisible: boolean;
    lcpLastCheck: number;
    dlLastUpdatedDate: number; // Download last updated date
    infoDialogOpen: boolean;
    returnDialogOpen: boolean;
    renewDialogOpen: boolean;
}

interface LibraryProps {
    catalog: Catalog;
    handleRead: any;
    openSnackbar: any;
    openDialog: any;
}

interface IDownload {
    link: string;
    progress: number;
}

export default class Library extends React.Component<LibraryProps, ILibraryState> {
    public state: ILibraryState;
    public props: LibraryProps;

    @lazyInject("translator")
    private translator: Translator;

    @lazyInject("store")
    private store: Store<RootState>;

    constructor(props: LibraryProps) {
        super(props);

        this.state = {
            list: false,
            lcpPassOpen: false,
            lcpPass: undefined,
            lcpPassVisible: false,
            lcpLastCheck: Date.now(),
            dlLastUpdatedDate: Date.now(),
            infoDialogOpen: false,
            currentPublication: undefined,
            returnDialogOpen: false,
            renewDialogOpen: false,
        };
    }

    public componentDidMount() {
        this.store.subscribe(() => {
            // Check lcp change
            const lcpStore = this.store.getState().lcp;
            if (
                lcpStore.lastUserKeyCheckDate &&
                lcpStore.lastUserKeyCheckDate !== this.state.lcpLastCheck
            ) {
                this.setState({
                    lcpPassOpen: (lcpStore.lastUserKeyCheck.status === UserKeyCheckStatus.Error),
                    lcpLastCheck: lcpStore.lastUserKeyCheckDate,
                });
            }

            // Check download change
            const dlStore = this.store.getState().publicationDownloads;
            if (
                dlStore.lastUpdatedDate &&
                dlStore.lastUpdatedDate !== this.state.dlLastUpdatedDate
            ) {
                this.setState({
                    dlLastUpdatedDate: dlStore.lastUpdatedDate,
                });
            }
        });
    }

    public downloadEPUB = (newPublication: Publication, publicationId: number) => {
        this.store.dispatch(publicationDownloadActions.add(newPublication));
    }

    public cancelDownload = (publication: Publication, publicationId: number) => {
        this.store.dispatch(publicationDownloadActions.cancel(publication));
    }

    public deletePublication = (publication: Publication) => {
        this.store.dispatch(catalogActions.removePublication(publication));
    }

    public openDeleteDialog = (publication: Publication) => {
        const message: JSX.Element = (<p>{this.translator.translate("dialog.delete")}</p>);
        this.props.openDialog(
            message,
            this.deletePublication.bind(this, publication),
        );
    }

    public Spinner() {
        return (
            <FontIcon
                style = {Styles.Library.spinner}
                className="fa fa-spinner fa-spin fa-3x fa-fw"
                color={blue500}
            />
        );
    }

    public createCardList() {
        const list: any = [];
        let i = 0;
        const dlStore = this.store.getState().publicationDownloads;

        for (const pub of this.props.catalog.publications.sort(this.sort)) {
            let downloading = false;
            let downloadProgress: number = null;

            if (dlStore.publicationDownloadProgress[pub.identifier]) {
                downloading = true;
                downloadProgress = dlStore.publicationDownloadProgress[pub.identifier];
            }

            list.push(<PublicationCard key={i}
                publicationId={i}
                downloading={downloading}
                downloadProgress={downloadProgress}
                publication={pub}
                handleRead={this.props.handleRead.bind(this)}
                cancelDownload={this.cancelDownload.bind(this)}
                deletePublication={this.openDeleteDialog.bind(this)}
                openInfoDialog={this.openInfoDialog.bind(this)}
                openReturnDialog={this.openReturnDialog.bind(this)}
                openRenewDialog={this.openRenewDialog.bind(this)}/>);
            i++;
        }
        return list;
    }

    public createElementList() {
        const list: any = [];
        let i = 0;
        const dlStore = this.store.getState().publicationDownloads;

        for (const pub of this.props.catalog.publications.sort(this.sort)) {
            let downloading = false;
            let downloadProgress: number = null;

            if (dlStore.publicationDownloadProgress[pub.identifier]) {
                downloading = true;
                downloadProgress = dlStore.publicationDownloadProgress[pub.identifier];
            }

            list.push(<PublicationListElement key={i}
                publication={pub}
                publicationId={i}
                downloading={downloading}
                downloadProgress={downloadProgress}
                handleRead={this.props.handleRead.bind(this)}
                cancelDownload={this.cancelDownload}
                deletePublication={this.openDeleteDialog.bind(this)}
                openInfoDialog={this.openInfoDialog.bind(this)}
                openReturnDialog={this.openReturnDialog.bind(this)}
                openRenewDialog={this.openRenewDialog.bind(this)}/>);
            i++;
        }
        return <div style={Styles.BookListElement.container}> {list} </div>;
    }

    public render(): React.ReactElement<{}>  {
        const __ = this.translator.translate.bind(this.translator);
        const list = this.state.list;

        let lcp;

        if (this.state.currentPublication) {
            lcp = this.state.currentPublication.lcp;
        }

        const that = this;
        let listToDisplay: JSX.Element;
        if (this.props.catalog) {
            if (this.state.list) {
                listToDisplay = this.createElementList();
            } else {
                listToDisplay = (
                    <div className={LibraryStyles.card_container}>
                        {this.createCardList()}
                    </div>
                );
            }
        } else {
            listToDisplay = <this.Spinner/>;
        }

        return (
            <div>
                <div>
                    <button
                        className={
                            classNames(LibraryStyles.display_button, !list && LibraryStyles.display_button_disable)
                        }
                        onClick={() => {that.setState({list: true});
                    }}>
                        <svg viewBox={ListIcon.content_table}>
                            <title>Add EPUB</title>
                            <use xlinkHref={"#" + ListIcon.id} />
                        </svg>
                    </button>
                    <button
                        className={
                            classNames(LibraryStyles.display_button, list && LibraryStyles.display_button_disable)
                        }
                        onClick={() => {that.setState({list: false});
                    }}>
                        <svg viewBox={CardIcon.content_table}>
                            <title>Add EPUB</title>
                            <use xlinkHref={"#" + CardIcon.id} />
                        </svg>
                    </button>
                </div >
                <div style={Styles.Library.list}>
                    {listToDisplay}
                </div>
                <Dialog
                    title={__("library.lcp.title")}
                    actions={[
                        <FlatButton
                            label={__("library.lcp.cancel")}
                            primary={true}
                            onClick={this.handleLcpPassClose.bind(this)}
                        />,
                        <FlatButton
                            label={__("library.lcp.submit")}
                            primary={true}
                            onClick={this.handleLcpPassSubmit.bind(this)}
                        />,
                    ]}
                    modal={true}
                    open={this.state.lcpPassOpen}
                >
                    {this.store.getState().lcp.lastUserKeyCheck && (
                        <div className={LibraryStyles.lcp_pass_form}>
                            <p>{__("library.lcp.sentence")}</p>
                            <p>{__("library.lcp.hintSentence") + this.store.getState().lcp.lastUserKeyCheck.hint} </p>
                            <div>
                                <TextField
                                    hintText={__("library.lcp.hint")}
                                    type={!this.state.lcpPassVisible ? "password" : "text"}
                                    onChange={this.handleLcpPassChange.bind(this)}
                                    value={this.state.lcpPass}
                                />
                                <button
                                    className={LibraryStyles.eye_button}
                                    onClick={this.switchLcpPassVisibe.bind(this)}>
                                    <svg viewBox={EyeIcon.eye}>
                                        <title>Show passphrase</title>
                                        <use xlinkHref={"#" + EyeIcon.id} />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}
                </Dialog>
                <Dialog
                    title={__("library.lcp.informations.title")}
                    actions={[
                        <FlatButton
                            label={__("library.lcp.informations.close")}
                            primary={true}
                            onClick={this.closeInfoDialog.bind(this)}
                        />,
                    ]}
                    modal={true}
                    open={this.state.infoDialogOpen}
                >
                    {this.state.currentPublication && (
                        <div>
                            <p>{__("library.lcp.informations.provider") + " " + lcp.provider}</p>
                            <p>{__("library.lcp.informations.issued") + " " + this.dateToString(lcp.issued)}</p>
                            {lcp.updated && (
                                <p>{__("library.lcp.informations.updated") + " " + this.dateToString(lcp.updated)}</p>
                            )}

                            {lcp.rights.start && (
                                <span>
                                    <h3>{__("library.lcp.informations.right.title")}</h3>
                                    <p>{__("library.lcp.informations.right.start") + " "
                                        + this.dateToString(lcp.rights.start)}</p>
                                </span>
                            )}
                            {lcp.rights.end && (
                                <p>{__("library.lcp.informations.right.end") + " "
                                    + this.dateToString(lcp.rights.end)}</p>
                            )}
                            {lcp.rights.copy && (
                                <p>{__("library.lcp.informations.right.copy") + " "
                                + lcp.rights.copy}</p>
                            )}
                            {lcp.rights.print && (
                                <p>{__("library.lcp.informations.right.print") + " "
                                    + lcp.rights.print}</p>
                            )}
                        </div>
                    )}
                </Dialog>
                <Dialog
                    actions={[
                        <FlatButton
                            label={__("dialog.yes")}
                            primary={true}
                            onClick={this.closeReturnDialog.bind(this)}
                        />,
                        <FlatButton
                            label={__("dialog.no")}
                            primary={true}
                            onClick={this.closeReturnDialog.bind(this)}
                        />,
                    ]}
                    modal={true}
                    open={this.state.returnDialogOpen}
                >
                    <p>{__("publication.returnSentence")}</p>
                </Dialog>
                <Dialog
                    actions={[
                        <FlatButton
                            label={__("dialog.yes")}
                            primary={true}
                            onClick={this.closeRenewDialog.bind(this, true)}
                        />,
                        <FlatButton
                            label={__("dialog.no")}
                            primary={true}
                            onClick={this.closeRenewDialog.bind(this)}
                        />,
                    ]}
                    modal={true}
                    open={this.state.renewDialogOpen}
                >
                    <p>{__("publication.renewSentence")}</p>
                </Dialog>
            </div>
        );
    }

    private sort(a: Publication, b: Publication) {

        // TODO: should get language from view state? (user preferences)
        const lang = "en";
        const atitle = getMultiLangString(a.title, lang);
        const btitle = getMultiLangString(b.title, lang);

        if (atitle > btitle) {
            return 1;
        } else if (atitle === btitle) {
            return 0;
        } else {
            return -1;
        }
    }

    private handleLcpPassClose() {
        this.setState({lcpPassOpen: false});
    }

    private handleLcpPassSubmit() {
        this.store.dispatch(
            lcpActions.sendPassphrase(
                this.store.getState().lcp.lastUserKeyCheck.publication,
                this.state.lcpPass,
            ),
        );
        this.handleLcpPassClose();
        this.setState({lcpPass: undefined});
    }

    private handleLcpPassChange(event: any) {
        const lcpPass = event.target.value;
        this.setState({lcpPass});
    }

    private switchLcpPassVisibe() {
        this.setState({lcpPassVisible: !this.state.lcpPassVisible});
    }

    private openInfoDialog(publication: Publication) {
        this.setState({infoDialogOpen: true, currentPublication: publication});
    }

    private closeInfoDialog() {
        this.setState({infoDialogOpen: false, currentPublication: undefined});
    }

    private openRenewDialog(publication: Publication) {
        this.setState({renewDialogOpen: true, currentPublication: publication});
    }

    private closeRenewDialog(yes?: boolean) {
        if (yes) {
            this.store.dispatch(lcpActions.lsdRenew(this.state.currentPublication));
        }
        this.setState({renewDialogOpen: false, currentPublication: undefined});
    }

    private openReturnDialog(publication: Publication) {
        this.setState({returnDialogOpen: true, currentPublication: publication});
    }

    private closeReturnDialog(yes?: boolean) {
        if (yes) {
            this.store.dispatch(lcpActions.lsdReturn(this.state.currentPublication));
        }
        this.setState({returnDialogOpen: false, currentPublication: undefined});
    }

    private dateToString(dateStr: Date): string {
        const date = new Date(dateStr);

        return date.toLocaleDateString() + " - " + date.getHours() + ":" + date.getMinutes();
    }
}
