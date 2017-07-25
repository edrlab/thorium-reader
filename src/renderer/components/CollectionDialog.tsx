import * as React        from "react";

import RaisedButton      from "material-ui/RaisedButton";

import { Styles }        from "readium-desktop/renderer/components/styles";

import { lazyInject } from "readium-desktop/renderer/di";
import { Store } from "redux";

import { Catalog } from "readium-desktop/models/catalog";
import { Publication } from "readium-desktop/models/publication";

import * as publicationDownloadActions from "readium-desktop/actions/publication-download";

import { RendererState } from "readium-desktop/renderer/reducers";

import { OpdsList } from "readium-desktop/renderer/components/Publication/index";

interface ICollectiondialogProps {
    open: boolean;
    closeFunction: Function;
    catalog: Catalog;
}

export default class CollectionDialog extends React.Component<ICollectiondialogProps, undefined> {
    @lazyInject("store")
    private store: Store<RendererState>;

    private pubToDownload: Publication[] = [];

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
                        { this.props.catalog !== undefined ? (
                            <OpdsList
                                catalog={this.props.catalog}
                                downloadEPUB={this.downloadEPUB.bind(this)}
                                handleCheckboxChange={this.handleOPDSCheckbox.bind(this)}/>
                        ) : (
                            <div>Pas liste :(</div>
                        )}
                        <div style={Styles.OpdsList.buttonContainer}>
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
    }
}
