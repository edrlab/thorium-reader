import * as React from "react";

import FontIcon     from "material-ui/FontIcon";
import IconButton   from "material-ui/IconButton";
import { blue500 }  from "material-ui/styles/colors";

import { Store } from "redux";

import * as publicationimportActions from "readium-desktop/actions/collection-manager";
import * as publicationDownloadActions from "readium-desktop/actions/publication-download";

import { Contributor } from "readium-desktop/models/contributor";
import { Publication } from "readium-desktop/models/publication";

import { lazyInject } from "readium-desktop/renderer/di";
import { RendererState } from "readium-desktop/renderer/reducers";

import * as windowActions from "readium-desktop/renderer/actions/window";

import { Translator }   from "readium-desktop/i18n/translator";

import { Catalog } from "readium-desktop/models/catalog";

import { PublicationCard, PublicationListElement } from "readium-desktop/renderer/components/Publication/index";

import { Styles } from "readium-desktop/renderer/components/styles";

interface ILibraryState {
    list: boolean;
    open: boolean;
}

interface LibraryProps {
    catalog: Catalog;
    handleRead: Function;
    openSnackbar: Function;
    openDialog: Function;
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
    private store: Store<RendererState>;

    @lazyInject("store")
    private  __ = this.translator.translate;

    constructor(props: LibraryProps) {
        super(props);

        this.state = {
            open: false,
            list: false,
        };
    }

    public componentDidMount() {
        this.store.dispatch(windowActions.showLibrary());
    }

    public downloadEPUB = (newPublication: Publication, publicationId: number) => {
        this.store.dispatch(publicationDownloadActions.add(newPublication));

        this.props.openSnackbar("library.startDownload");
    }

    public cancelDownload = (publication: Publication, publicationId: number) => {
        this.store.dispatch(publicationDownloadActions.cancel(publication));

        this.props.openSnackbar("library.cancelDownload");
    }

    public deletePublication = (identifier: string) => {
        this.store.dispatch(publicationimportActions.fileDelete(identifier));
    }

    public openDeleteDialog = (identifier: string) => {
        let message: JSX.Element = (<p>{this.translator.translate("dialog.delete")}</p>);
        this.props.openDialog(message, this.deletePublication.bind(this, identifier));
    }

    public Spinner () {
        return (
            <FontIcon
                style = {Styles.Library.spinner}
                className="fa fa-spinner fa-spin fa-3x fa-fw"
                color={blue500}
            />
        );
    }

    public createCardList() {
        let list: any = [];
        for (let i = 0; i < this.props.catalog.publications.length; i++) {
            list.push(<PublicationCard key={i}
                publicationId={i}
                downloadable={false}
                publication={this.props.catalog.publications[i]}
                downloadEPUB={this.downloadEPUB}
                handleRead={this.props.handleRead.bind(this)}
                cancelDownload={this.cancelDownload.bind(this)}
                deletePublication={this.openDeleteDialog.bind(this)}
                createCover={this.createCover.bind(this)} />);
        }
        return list;
    }

    public createElementList() {
        let list: any = [];
        for (let i = 0; i < this.props.catalog.publications.length; i++) {
            list.push(<PublicationListElement key={i}
                publication={this.props.catalog.publications[i]}
                publicationId={i}
                downloadable={false}
                downloadEPUB={this.downloadEPUB}
                handleRead={this.props.handleRead.bind(this)}
                cancelDownload={this.cancelDownload}
                deletePublication={this.openDeleteDialog.bind(this)}
                createCover={this.createCover.bind(this)} />);
        }
        return <div style={Styles.BookListElement.container}> {list} </div>;
    }

    public createCover (publication: Publication): JSX.Element {
        if (publication.cover === null) {
            let authors = "";
            let bodyCSS = Styles.BookCover.body;
            let colors = publication.customCover;
            bodyCSS.backgroundImage = "linear-gradient(" + colors.topColor + ", " + colors.bottomColor + ")";

            for (let author of publication.authors) {
                let newAuthor: Contributor = author;
                if (authors !== "") {
                    authors += ", ";
                }
                authors += newAuthor.name;
            }

            return (
                <div style={bodyCSS}>
                    <div style={Styles.BookCover.box}>
                        <p style={Styles.BookCover.title}>{publication.title}</p>
                        <p style={Styles.BookCover.author}>{authors}</p>
                    </div>
                </div>
            );
        } else {
            return undefined;
        }

    }

    public render(): React.ReactElement<{}>  {
        const that = this;
        let listToDisplay: JSX.Element;
        if (this.props.catalog) {
            if (this.state.list) {
                listToDisplay = this.createElementList();
            } else {
                listToDisplay = this.createCardList();
            }
        } else {
            listToDisplay = <this.Spinner/>;
        }

        return (
            <div>
                <div>
                    <h1 style={Styles.Library.title}>{this.__("library.heading")}</h1>
                    <IconButton
                        style={Styles.Library.displayButton}
                        touch={true} onClick={() => {
                            that.setState({list: true});
                        }}
                    >
                        <FontIcon className="fa fa-list" color={blue500} />
                    </IconButton>
                    <IconButton
                        style={Styles.Library.displayButton}
                        touch={true}  onClick={() => {
                            that.setState({list: false});
                        }}
                    >
                        <FontIcon className="fa fa-th-large" color={blue500} />
                    </IconButton>
                </div >
                <div style={Styles.Library.list}>
                    {listToDisplay}
                </div>
            </div>
        );
    }
}
