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
                                    <li
                                        key={i}
                                        className={styles.block_book_list +
                                            (menuOpen === i ? " " + styles.menuOpen : "")}
                                    >
                                        <div className={styles.list_book_title}>
                                        <p className={styles.book_title} aria-label="Titre du livre">{pub.title}</p>
                                        <p
                                            className={`${styles.book_author} ${styles.lightgrey}`}
                                            aria-label="Auteur du livre"
                                        >
                                            {pub.authors.map((author) => author.name).join(", ")}
                                        </p>
                                        </div>
                                        <p className={styles.infos_sup} aria-label="Date de sortie du livre">2017</p>
                                        <p className={styles.infos_sup} aria-label="Éditeur du livre">Larousse</p>
                                        <button
                                            type="button"
                                            aria-haspopup="dialog"
                                            aria-controls="dialog"
                                            title="Voir plus"
                                            onClick={this.handleMenuClick.bind(this, i)}
                                        >
                                            <svg role="link" className={styles.icon_seemore}>
                                                <g aria-hidden="true">
                                                <path d="M0 0h24v24H0z" fill="none"/>
                                                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2
                                                    2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1
                                                    0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                                                </g>
                                            </svg>
                                        </button>
                                        <div className={styles.listMenu}>
                                            <a onClick={this.openDialog} >Fiche livre</a>
                                            <a>Retirer de la séléction</a>
                                            <a>Supprimer définitivement</a>
                                        </div>
                                    </li>
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
