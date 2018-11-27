import * as React from "react";

import * as uuid from "uuid";

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

import { apiActions } from "readium-desktop/common/redux/actions";

import { readerActions } from "readium-desktop/common/redux/actions";

import { CatalogView } from "readium-desktop/common/views/catalog";

import { PublicationView } from "readium-desktop/common/views/publication";
import CatalogEntry from "readium-desktop/renderer/components/catalog/CatalogEntrie";

interface Props {
    apiRequestId?: string;
    catalog?: CatalogView;
    requestCatalog?: any;
    cleanData?: any;
}

interface States {
    menuInfos: {open: boolean, el: React.RefObject<any>, publication: PublicationView};
    dialogInfos: {open: boolean, publication: PublicationView};
}

export class CatalogCard extends React.Component<Props, States> {

    @lazyInject("translator")
    private translator: Translator;

    @lazyInject("store")
    private store: Store<RootState>;

    private menuRef: React.RefObject<any>;

    public constructor(props: Props) {
        super(props);

        this.state = {
            menuInfos: {
                open: false,
                el: undefined,
                publication: undefined,
            },
            dialogInfos: {
                open: false,
                publication: undefined,
            },
        };

        this.menuRef = React.createRef();

        this.closeDialog = this.closeDialog.bind(this);
        this.handleRead = this.handleRead.bind(this);
        this.openDialog = this.openDialog.bind(this);
    }

    public componentDidMount() {
        this.props.requestCatalog();
    }

    public componentWillUnmount() {
        this.props.cleanData();
    }

    public render(): React.ReactElement<{}> {
        const __ = this.translator.translate.bind(this.translator);
        const dialogOpen = this.state.dialogInfos.open;

        let menuStyle = {
            position: "absolute" as "absolute",
            top: 0,
            left: 0,
        };
        if (this.state.menuInfos.el) {
            const el = this.state.menuInfos.el.current;
            const position = el.getBoundingClientRect();
            menuStyle = {
                position: "absolute",
                top: position.top + el.offsetHeight + 5,
                left: position.left - this.menuRef.current.offsetWidth + (el.offsetWidth / 2),
            };
        }

        return (
            <>
                <Header activePage={0}/>
                <MyBooksHeader dialogOpen={this.state.dialogInfos.open}/>
                <main style={this.getDialogBlur()} id={styles.main} role="main">
                    <a id="contenu" tabIndex={-1}></a>
                    { this.props.catalog && this.props.catalog.entries.map((entry) =>
                        <CatalogEntry
                            entry={entry}
                            handleRead={this.handleRead}
                            handleMenuClick={this.handleRead}
                            openDialog={this.openDialog}
                        />
                    )}
                </main>
                <BookDetailsDialog
                    open={this.state.dialogInfos.open}
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

const Catalog = connect(mapStateToProps, mapDispatchToProps)(CatalogCard);

(Catalog as any).defaultProps = {
    apiRequestId: uuid.v4(),
};

export default Catalog;
