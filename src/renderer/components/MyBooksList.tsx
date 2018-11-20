import * as React from "react";

import * as styles from "readium-desktop/renderer/assets/styles/myBooks.css";

import { Translator } from "readium-desktop/common/services/translator";
import { lazyInject } from "readium-desktop/renderer/di";

import { connect } from "react-redux";

import BookDetailsDialog from "readium-desktop/renderer/components/BookDetailsDialog";
import Header from "readium-desktop/renderer/components/Header";
import MyBooksHeader from "readium-desktop/renderer/components/MyBooksHeader";

import { Catalog } from "readium-desktop/common/models/catalog";

import { Publication } from "readium-desktop/common/models/publication";

import { RootState } from "readium-desktop/renderer/redux/states";
import { Store } from "redux";

import { readerActions } from "readium-desktop/common/redux/actions";
import { PublicationListElement } from "readium-desktop/renderer/components/Publication";

interface Props {
    catalog: Catalog;
}

interface States {
    menuInfos: {open: number, publication: Publication};
    dialogInfos: {open: boolean, publication: Publication};
}

export class MyBooksList extends React.Component<Props, States> {

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
        this.handleMenuClick = this.handleMenuClick.bind(this);
        this.openDialog = this.openDialog.bind(this);
    }

    public render(): React.ReactElement<{}> {
        const __ = this.translator.translate.bind(this.translator);
        const dialogOpen = this.state.dialogInfos.open;
        const menuOpen = this.state.menuInfos.open;

        return (
            <>
                <Header activePage={0}/>
                <MyBooksHeader list={true} dialogOpen={this.state.dialogInfos.open}/>
                <main style={this.getDialogBlur()} id={styles.main} role="main">
                    <a id="contenu" tabIndex={-1}></a>
                    <section>
                        <h1>Reprendre la lecture</h1>
                        <ul>
                            { this.props.catalog && this.props.catalog.publications
                                && this.props.catalog.publications.map((pub: Publication, i: number) => {
                                return (
                                    <PublicationListElement
                                        key={i}
                                        publication={pub}
                                        id={i}
                                        handleMenuClick={this.handleMenuClick.bind(this)}
                                        openDialog={this.openDialog}
                                        menuOpen={menuOpen === i}
                                    />
                                );
                            })}
                        </ul>
                    </section>
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

    private handleRead(publication: Publication) {
        this.store.dispatch(readerActions.open(publication));
    }

    private handleMenuClick(id: number) {
        this.setState({menuInfos: {
            open: this.state.menuInfos.open !== id ? id : null,
            publication: this.props.catalog.publications[id],
        }});
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

const mapStateToProps = (state: any) => {
    return {
        catalog: {
            title: "My Books",
            publications: state.catalog.publications,
        },
    };
};

export default connect(mapStateToProps)(MyBooksList);
