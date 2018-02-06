import * as React from "react";

import FontIcon from "material-ui/FontIcon";
import IconButton from "material-ui/IconButton";
import RaisedButton from "material-ui/RaisedButton";

import { Styles } from "readium-desktop/renderer/components/styles/styles";

import { lazyInject } from "readium-desktop/renderer/di";
import { Store } from "redux";

import { Catalog } from "readium-desktop/common/models/catalog";
import { Publication } from "readium-desktop/common/models/publication";

import { publicationDownloadActions } from "readium-desktop/common/redux/actions";

import { RootState } from "readium-desktop/renderer/redux/states";

import {
    AuthenticationForm,
    OpdsList,
} from "readium-desktop/renderer/components/opds/index";

import { OPDS } from "readium-desktop/common/models/opds";

import { OPDSParser } from "readium-desktop/common/services/opds";

import { OpdsForm } from "readium-desktop/renderer/components/opds/index";

import * as request from "request";

import { Translator } from "readium-desktop/common/services/translator";

interface ICollectionDialogState {
    catalog: Catalog;
    downloadError: boolean;
    downloadUrl: string;
    userInfo: User;
}

interface ICollectiondialogProps {
    open: boolean;
    closeList: Function;
    openDialog: Function;
    closeDialog: Function;
    opds: OPDS;
    updateDisplay: Function;
}

interface User {
    username: string;
    password: string;
}

export default class CollectionDialog extends React.Component<ICollectiondialogProps, ICollectionDialogState> {
    @lazyInject("store")
    private store: Store<RootState>;

    @lazyInject("translator")
    private translator: Translator;

    private pubToDownload: Publication[] = [];

    constructor(props: ICollectiondialogProps) {
        super(props);
        this.state = {
            catalog: undefined,
            downloadError: false,
            downloadUrl: "",
            userInfo: undefined,
        };
    }

    public componentDidMount() {
        this.downloadCatalog();
        this.setState({downloadUrl: this.props.opds.url});
    }

    public componentDidUpdate() {
        if (this.state.downloadUrl !== this.props.opds.url) {
            this.downloadCatalog();
        }
    }

    public createElementList() {
        let list: any = [];

        return <div> {list} </div>;
    }

    public downloadEPUB = (newPublication: Publication) => {
        this.store.dispatch(publicationDownloadActions.add(newPublication));
    }

    public render(): React.ReactElement<{}>  {
        const __ = this.translator.translate.bind(this.translator);

        let style = {};
        if (this.props.open) {
            style = Styles.collectionDialog;
        }

        return (
            <div style={style}>
                { this.props.open ? (
                    <div style={Styles.OpdsList.parent}>
                        <h2 style={Styles.OpdsList.title} >{this.props.opds.name}</h2>
                        <IconButton
                            style={Styles.OpdsList.refreshButton}
                            tooltip="Refresh Feed"
                            onClick={() => {this.downloadCatalog(this.state.userInfo); }}>
                            <FontIcon className="fa fa-refresh" />
                        </IconButton>
                        { this.state.downloadError ? (
                            <div>
                                <p>{__("opds.downloadError")}</p>
                            </div>
                        ) : this.state.catalog !== undefined ? (
                            <OpdsList
                                catalog={this.state.catalog}
                                handleCheckboxChange={this.handleOPDSCheckbox.bind(this)}/>
                        ) : (
                            <div></div>
                        )}
                        <div style={Styles.OpdsList.buttonContainer}>
                        <RaisedButton
                            style={Styles.OpdsList.button}
                            label={__("opds.settings")}
                            onClick={() => {
                                this.props.openDialog((
                                    <OpdsForm
                                        closeDialog={this.props.closeDialog}
                                        closeFunction={this.props.closeList}
                                        opds={this.props.opds}
                                        updateDisplay={this.props.updateDisplay}/>
                                    ),
                                    null,
                                    []);
                            }}/>
                        <RaisedButton
                            style={Styles.OpdsList.button}
                            label={__("opds.download")}
                            onClick={() => {
                                this.startDownload();
                                this.props.closeList();
                            }}/>
                        <RaisedButton
                            label={__("opds.back")}
                            onClick={() => {this.props.closeList(); }}/>
                        </div>
                    </div>
                ) : (
                    <div>

                    </div>
                )}
            </div>
        );
    }

    private handleOPDSCheckbox (publication: Publication) {
        let found = false;
        let i = 0;
        for (let pub of this.pubToDownload)
        {
            if (pub.identifier === publication.identifier) {
                found = true;
                break;
            }
            i++;
        }
        if (!found) {
            this.pubToDownload.push(publication);
        } else {
            this.pubToDownload.splice(i, 1);
        }
    }

    private startDownload() {
        for (let pub of this.pubToDownload) {
            this.downloadEPUB(pub);
        }
        this.pubToDownload = [];
    }

    private downloadCatalog (user?: User) {
        let req = request.get(this.props.opds.url, (error: any, response: any, body: any) => {
            if (response && response.statusCode === 401) {
                this.props.openDialog(
                    <AuthenticationForm
                    closeDialog={this.props.closeDialog}
                    downloadOPDS={this.downloadCatalog.bind(this)}
                    closeList={this.props.closeList}/>,
                    null, []);
                return;
            }

            if (response && (
                    response.statusCode < 200 || response.statusCode > 299)) {
                // Unable to download the resource
                this.setState({
                    downloadError: true,
                    downloadUrl: this.props.opds.url,
                });
                return;
            }

            if (error) {
                this.setState({
                    downloadError: true,
                    downloadUrl: this.props.opds.url,
                });
                return;
            }

            // A correct response has been received
            // So parse the feed and generate a catalog
            const opdsParser: OPDSParser = new OPDSParser();
            opdsParser
                .parse(body)
                .then((newCatalog: Catalog) => {
                    this.setState({
                        catalog: newCatalog,
                        downloadError: false,
                        downloadUrl: this.props.opds.url,
                        userInfo: user,
                    });
                });
        });
        if (user) {
            req.auth(user.username, user.password);
        }
    }
}
