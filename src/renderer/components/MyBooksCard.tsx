import * as React from "react";

import * as styles from "readium-desktop/renderer/assets/styles/myBooks.css";

import { Translator } from "readium-desktop/common/services/translator";
import { lazyInject } from "readium-desktop/renderer/di";

import { connect } from "react-redux";

import Slider from "readium-desktop/renderer/components/utils/Slider";

import BookDetailsDialog from "readium-desktop/renderer/components/BookDetailsDialog";
import Header from "readium-desktop/renderer/components/Header";
import MyBooksHeader from "readium-desktop/renderer/components/MyBooksHeader";

import { Catalog } from "readium-desktop/common/models/catalog";
import { PublicationCard } from "readium-desktop/renderer/components/Publication";

import { Publication } from "readium-desktop/common/models/publication";

import { RootState } from "readium-desktop/renderer/redux/states";
import { Store } from "redux";

import { readerActions } from "readium-desktop/common/redux/actions";

interface Props {
    catalog: Catalog;
}

interface States {
    menuInfos: {open: boolean, el: React.RefObject<any>, publication: Publication};
    dialogInfos: {open: boolean, publication: Publication};
}

export class MyBooksCard extends React.Component<Props, States> {

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

        this.handleOnBlurMenu = this.handleOnBlurMenu.bind(this);
        this.closeDialog = this.closeDialog.bind(this);
        this.handleRead = this.handleRead.bind(this);
        this.handleMenuClick = this.handleMenuClick.bind(this);
        this.openDialog = this.openDialog.bind(this);
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
                    <section>
                        <h1>Derniers ajouts</h1>
                        { this.props.catalog && this.props.catalog.publications &&
                            <Slider
                                className={styles.slider}
                                displayQty={6}
                                content={this.props.catalog.publications.map((pub, index: number) =>
                                    <PublicationCard
                                        key={index}
                                        publication={pub}
                                        handleRead={this.handleRead}
                                        handleMenuClick={this.handleMenuClick}
                                    />,
                                )}
                            />
                        }
                    </section>
                </main>
                <div
                    ref={this.menuRef}
                    style={menuStyle}
                    className={(this.state.menuInfos.open ? styles.menu_active + " " : "") + styles.menu}
                >
                    <a tabIndex={1} onClick={this.openDialog} onBlur={this.handleOnBlurMenu}>Fiche livre</a>
                    <a tabIndex={2} onBlur={this.handleOnBlurMenu}>Retirer de la séléction</a>
                    <a tabIndex={3} onBlur={this.handleOnBlurMenu}>Supprimer définitivement</a>
                </div>
                <BookDetailsDialog
                    open={this.state.dialogInfos.open}
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

    private handleMenuClick(el: React.RefObject<any>, publication: Publication) {
        this.setState({menuInfos: {
            open: el === this.state.menuInfos.el ? !this.state.menuInfos.open : true,
            el,
            publication,
        }});
        this.menuRef.current.children[0].focus();
    }

    private handleOnBlurMenu(e: any) {
        if (!e.relatedTarget || (e.relatedTarget && e.relatedTarget.parentElement !== this.menuRef.current)) {
            const { menuInfos } = this.state;
            menuInfos.open = false;
            this.setState({ menuInfos });
        }
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

export default connect(mapStateToProps)(MyBooksCard);
