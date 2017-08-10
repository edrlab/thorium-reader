import * as React        from "react";

import RaisedButton      from "material-ui/RaisedButton";

import { Styles }        from "readium-desktop/renderer/components/styles";

import { lazyInject } from "readium-desktop/renderer/di";
import { Store } from "redux";

import { Catalog } from "readium-desktop/models/catalog";
import { Publication } from "readium-desktop/models/publication";

import * as publicationDownloadActions from "readium-desktop/actions/publication-download";

import { RendererState } from "readium-desktop/renderer/reducers";

import { OpdsList } from "readium-desktop/renderer/components/opds/index";

import { OPDS } from "readium-desktop/models/opds";

import { OPDSParser } from "readium-desktop/services/opds";

import { OpdsForm } from "readium-desktop/renderer/components/opds/index";

import * as request from "request";

interface ICollectionDialogState {
    catalog: Catalog;
    downloadError: boolean;
}

interface ICollectiondialogProps {
    open: boolean;
    closeFunction: Function;
    openDialog: Function;
    closeDialog: Function;
    opds: OPDS;
}

export default class CollectionDialog extends React.Component<ICollectiondialogProps, ICollectionDialogState> {
    @lazyInject("store")
    private store: Store<RendererState>;

    private pubToDownload: Publication[] = [];

    constructor() {
        super();
        this.state = {
            catalog: undefined,
            downloadError: false,
        };
    }

    public componentDidMount() {
        this.downloadCatalog();
    }

    public createElementList() {
        let list: any = [];

        return <div> {list} </div>;
    }

    public downloadEPUB = (newPublication: Publication) => {
        this.store.dispatch(publicationDownloadActions.add(newPublication));
    }

    public render(): React.ReactElement<{}>  {
        let style = {};
        if (this.props.open) {
            style = Styles.collectionDialog;
        }

        return (
            <div style={style}>
                 { this.props.open ? (
                     <div style={Styles.OpdsList.parent}>
                         <h2>{this.props.opds.name}</h2>
                        { this.state.catalog !== undefined ? (
                            <OpdsList
                                catalog={this.state.catalog}
                                handleCheckboxChange={this.handleOPDSCheckbox.bind(this)}/>
                        ) : this.state.downloadError ? (
                            <div>
                                <p>Impossible de télécharger le contenu du flux OPDS.</p>
                                <p>veuillez verifier l'adresse du flux ou votre connexion intenet</p>
                            </div>
                        ) : (
                            <div></div>
                        )}
                        <div style={Styles.OpdsList.buttonContainer}>
                        <RaisedButton
                            style={Styles.OpdsList.button}
                            label="Parametre"
                            onClick={() => {
                                this.props.openDialog((
                                    <OpdsForm
                                        closeDialog={this.props.closeDialog}
                                        closeFunction={this.props.closeFunction}
                                        opds={this.props.opds}/>
                                    ),
                                    null,
                                    []);
                            }}/>
                        <RaisedButton
                            style={Styles.OpdsList.button}
                            label="Télécharger"
                            onClick={() => {
                                this.startDownload();
                                this.props.closeFunction();
                            }}/>
                        <RaisedButton
                            label="Retour"
                            onClick={() => {this.props.closeFunction(); }}/>
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

    private downloadCatalog () {
        request(this.props.opds.url, (error: any, response: any, body: any) => {
        if (response && (
                response.statusCode < 200 || response.statusCode > 299)) {
            // Unable to download the resource
            this.setState({downloadError: true});
            return;
        }

        if (error) {
            this.setState({downloadError: true});
            return;
        }

        // A correct response has been received
        // So parse the feed and generate a catalog
        const opdsParser: OPDSParser = new OPDSParser();
        opdsParser
            .parse(body)
            .then((newCatalog: Catalog) => {
                this.setState({catalog: newCatalog});
            });
    });
    }

}
