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

import * as fs from "fs";

interface ILibraryState {
    list: boolean;
    open: boolean;
}

interface LibraryProps {
    catalog: Catalog;
    handleRead: Function;
    openSnackbar: Function;
}

interface IDownload {
    link: string;
    progress: number;
}

const styles = {
    BookListElement: {
        container: {
            display: "inline-block",
            maxWidth: 1200,
            textAlign: "left",
        },
    },
    Library: {
        addButton: {
            float: "right",
            marginTop: "6px",
        },
        displayButton: {
            float: "right",
        },
        list: {
            textAlign: "center",
        },
        title: {
            display: "inline-block",
        },
        spinner: {
            top: "200px",
            fontSize: "40px",
        },
    },
    BookCard: {
        body: {
            display: "inline-block",
            height: 400,
            margin: "5px 5px",
            textAlign: "center",
            width: 210,
        },
        downloadButton: {
            top: "50%",
        },
        image: {
            height: 320,
            width: 210,
        },
        title: {
            overflow: "hidden",
            whiteSpace: "nowrap",
        },
        titleCard: {
            top: "320px",
        },
        titleCover: {
            position: "absolute",
            top: "10px",
        },
    },
};

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

    public Spinner () {
        return (
            <FontIcon
                style = {styles.Library.spinner}
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
                deletePublication={this.deletePublication.bind(this)}
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
                downloadEPUB={this.downloadEPUB}
                handleRead={this.props.handleRead.bind(this)}
                cancelDownload={this.cancelDownload} />);
        }
        return <div style={styles.BookListElement.container}> {list} </div>;
    }

    public createCover (publication: Publication): JSX.Element {
        let urlTemplate = "coverTemplate/";

        let authors = "";

        for (let author of publication.authors) {
            let newAuthor: Contributor = author;
            if (authors !== "") {
                authors += ", ";
            }
            authors += newAuthor.name;
        }

        let templates = fs.readdirSync(urlTemplate);
        let templateId = Math.floor(Math.random() * (templates.length ));

        return (
            <div style={{textAlign: "center"}}>
                <p style={{position: "absolute", margin: "20px 5%", width: "90%"}}>{publication.title}</p>
                <p style={{position: "absolute", bottom: "10px", margin: "10px 5%", width: "90%"}}>{authors}</p>
                <img style={styles.BookCard.image} src={"../" + urlTemplate + templates[templateId]}/>
            </div>
        );

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
                    <h1 style={styles.Library.title}>{this.__("library.heading")}</h1>
                    <IconButton
                        style={styles.Library.displayButton}
                        touch={true} onClick={() => {
                            that.setState({list: true});
                        }}
                    >
                        <FontIcon className="fa fa-list" color={blue500} />
                    </IconButton>
                    <IconButton
                        style={styles.Library.displayButton}
                        touch={true}  onClick={() => {
                            that.setState({list: false});
                        }}
                    >
                        <FontIcon className="fa fa-th-large" color={blue500} />
                    </IconButton>
                </div >
                <div style={styles.Library.list}>
                    {listToDisplay}
                </div>
            </div>
        );
    }
}
