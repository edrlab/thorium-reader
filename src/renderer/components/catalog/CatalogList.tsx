import * as React from "react";

import * as styles from "readium-desktop/renderer/assets/styles/myBooks.css";

import { Translator } from "readium-desktop/common/services/translator";
import { lazyInject } from "readium-desktop/renderer/di";

import { connect } from "react-redux";

import BookDetailsDialog from "readium-desktop/renderer/components/BookDetailsDialog";
import Header from "readium-desktop/renderer/components/Header";
import MyBooksHeader from "readium-desktop/renderer/components/catalog/CatalogHeader";

import { Catalog } from "readium-desktop/common/models/catalog";

import { RootState } from "readium-desktop/renderer/redux/states";
import { Store } from "redux";

import { readerActions, apiActions } from "readium-desktop/common/redux/actions";
import { PublicationListElement } from "readium-desktop/renderer/components/Publication";

import { PublicationView } from "readium-desktop/common/views/publication";
import uuid = require("uuid");
import { CatalogView } from "readium-desktop/common/views/catalog";
import CatalogEntry from "readium-desktop/renderer/components/catalog/CatalogEntrie";

interface Props {
    apiRequestId?: string;
    catalog?: CatalogView;
    requestCatalog?: any;
    cleanData?: any;
}

interface States {
    menuInfos: {open: number, publication: PublicationView};
    dialogInfos: {open: boolean, publication: PublicationView};
}

export class CatalogList extends React.Component<Props, States> {

    @lazyInject("translator")
    private translator: Translator;

    @lazyInject("store")
    private store: Store<RootState>;

    private menuRef: React.RefObject<any>;

    public constructor(props: Props) {
        super(props);

        this.state = {
            menuInfos: {
                open: null,
                publication: undefined,
            },
            dialogInfos: {
                open: false,
                publication: undefined,
            },
        };

        this.closeDialog = this.closeDialog.bind(this);
        this.handleRead = this.handleRead.bind(this);
        this.openDialog = this.openDialog.bind(this);
    }

    public render(): React.ReactElement<{}> {
        const __ = this.translator.translate.bind(this.translator);
        const dialogOpen = this.state.dialogInfos.open;

        return (
            <>
                <Header activePage={0}/>
                <MyBooksHeader list={true} dialogOpen={dialogOpen}/>
                <main style={this.getDialogBlur()} id={styles.main} role="main">
                    <a id="contenu" tabIndex={-1}></a>
                    { this.props.catalog && this.props.catalog.entries.map((entry) =>
                        <CatalogEntry
                            entry={entry}
                            openDialog={this.openDialog}
                            handleRead={this.handleRead}
                            handleMenuClick={this.handleRead}
                            list={true}
                        />
                    )}
                </main>
                <BookDetailsDialog
                    open={dialogOpen}
                    publication={this.state.dialogInfos.publication}
                    closeDialog={this.closeDialog}
                    readPublication={this.handleRead}
                />
            </>
        );
    }

    private handleRead(publication: PublicationView) {
        this.store.dispatch(readerActions.open(publication));
    }

    private closeDialog() {
        this.setState({dialogInfos: {open: false, publication: undefined}});
    }

    private openDialog() {
        this.setState({dialogInfos: {open: true, publication: this.state.menuInfos.publication}});
    }

    private getDialogBlur() {
        return this.state.dialogInfos.open ? {filter: "blur(2px)"} : {};
    }
}

const mapDispatchToProps = (dispatch: any, ownProps: Props) => {
    const { apiRequestId } = ownProps;

    return {
        requestCatalog: () => {
            dispatch(
                apiActions.buildRequestAction(
                    apiRequestId,
                    "catalog",
                    "get",
                ),
            );
        },
        cleanData: () => {
            dispatch(
                apiActions.clean(apiRequestId),
            );
        },
    };
};

const mapStateToProps = (state: any, ownProps: Props): any => {
    const { apiRequestId } = ownProps;

    let catalog = null;

    if (apiRequestId in state.api.data) {
        catalog = state.api.data[apiRequestId].result;
    }

    return {
        catalog,
    };

};

const Catalog = connect(mapStateToProps, mapDispatchToProps)(CatalogList);

(Catalog as any).defaultProps = {
    apiRequestId: uuid.v4(),
};

export default Catalog;
