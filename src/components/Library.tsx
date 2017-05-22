import * as fs from "fs";

import * as React from "react";
import { Store } from "redux";

import { Card, CardMedia, CardTitle} from "material-ui/Card";
import FlatButton from "material-ui/FlatButton";
import FontIcon from "material-ui/FontIcon";
import IconButton from "material-ui/IconButton";
import RaisedButton from "material-ui/RaisedButton";
import { blue500 } from "material-ui/styles/colors";

import { lazyInject } from "readium-desktop/di";
import { Translator } from "readium-desktop/i18n/translator";
import { IAppState } from "readium-desktop/reducers/app";

import { Catalog } from "readium-desktop/models/catalog";

import * as ReactCardFlip from "react-card-flip";

import * as request from "request";

interface ILibraryState {
    locale: string;
    list: boolean;
    isFlipped: boolean[];
}

interface ILibraryProps {
    catalog: Catalog;
}

const styles = {
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
    },
    BookListElement: {
        body: {
            boxShadow: "rgba(0, 0, 0, 0.117647) 0px 1px 6px, rgba(0, 0, 0, 0.117647) 0px 1px 4px",
            fontFamily: "Roboto, sans-serif",
            margin: "5px 0px",
            width: "1200px",
        },
        column: {
            display: "inline-block",
            width: "250px",
        },
        container: {
            display: "inline-block",
            maxWidth: 1200,
            textAlign: "left",
        },
        description: {
            display: "inline-block",
            height: 120,
            marginLeft: "5px",
        },
        image: {
            display: "inline-block",
            float: "left",
            height: 120,
            width: 78,
        },
        title: {
            margin: "10px 0px",
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
};

function downloadEPUB(url: string, title: string) {
        let fileName = title.replace(/ /g, "-");
        fileName = fileName.substring(0, 245);
        let i: number = 0;
        if (fs.existsSync("./epubs/" + fileName + ".epub")) {
            i = 2;
            while (fs.existsSync("./epubs/" + fileName + "(" + i + ")" + ".epub")) {
                i++;
            }
        }
        if (i !== 0) {
            fileName = fileName + "(" + i + ")";
        }
        let file = fs.createWriteStream("./epubs/" + fileName + ".epub");
        request.get(url).pipe(file);
}

export default class Library extends React.Component<ILibraryProps, ILibraryState> {
    public state: ILibraryState;

    @lazyInject("translator")
    private translator: Translator;

    @lazyInject("store")
    private store: Store<IAppState>;

    private catalog: Catalog;

    constructor() {
        super();
        this.state = {
            isFlipped: [],
            list: false,
            locale: this.store.getState().i18n.locale,
        };
    }

    public handleFront(id: any) {
        let newIsFlipped = this.state.isFlipped;
        newIsFlipped[id] = true;
        this.setState({ isFlipped: newIsFlipped });
    }

    public handleBack(id: any) {
        let newIsFlipped = this.state.isFlipped;
        newIsFlipped[id] = false;
        this.setState({ isFlipped: newIsFlipped });
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

    public BookListElement (props: any) {
            const book = props.book;
            let translator = props.translator;
            return (
                <div style={styles.BookListElement.body}>
                    <img style={styles.BookListElement.image} src={book.image} />
                    <div style={styles.BookListElement.description}>
                        <h4 style={styles.BookListElement.title}>{book.title}</h4>
                        <div style={styles.BookListElement.column}>
                            <p>{book.author}</p>
                            <p>{book.editor}</p>
                        </div>
                        <div style={styles.BookListElement.column}>
                            <p>{book.format}</p>
                            <p>{book.size}</p>
                        </div>
                            <FlatButton
                                style={styles.BookCard.downloadButton}
                                label={translator.translate("library.downloadButton")}
                                onClick={() => {downloadEPUB(book.downloadUrl, book.title); }}/>
                    </div>
                </div>
            );
    };

    public BookCard = (props: any) => {
            const book = props.book;
            let that = this;
            let id = book.id;

            return (
                <div style={styles.BookCard.body}>
                    <Card style={styles.BookCard.body}>
                        <CardMedia>
                            <div style={styles.BookCard.image}
                                 onMouseEnter={() => {this.handleFront(id); }}
                                 onMouseLeave={() => {this.handleBack(id); }}>
                                <ReactCardFlip isFlipped={that.state.isFlipped[id]}>
                                    <div key="front" >
                                        <div>
                                            <img  style={styles.BookCard.image} src={book.image}/>
                                        </div>
                                    </div>
                                    <div key="back">
                                        <div
                                            style={styles.BookCard.image}
                                        >
                                            {props.downloadable ? (
                                                <div>
                                                    <FlatButton
                                                        style={styles.BookCard.downloadButton}
                                                        label={this.translator.translate("library.downloadButton")}
                                                        onClick={() => {downloadEPUB(book.downloadUrl, book.title); }}/>
                                                </div>
                                            ) : (
                                                <div>
                                                    <FlatButton
                                                    style={styles.BookCard.downloadButton}
                                                    label="Supprimer" />

                                                    <FlatButton
                                                    style={styles.BookCard.downloadButton}
                                                    label={"Favoris"}
                                                    onClick={() => {downloadEPUB(book.downloadUrl, book.title); }}/>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </ReactCardFlip>
                            </div>
                        </CardMedia>
                        <CardTitle
                            titleStyle={{whiteSpace: "nowrap", overflow: "hidden"}}
                            subtitleStyle={{whiteSpace: "nowrap", overflow: "hidden"}}
                            title={book.title}
                            subtitle={book.author}
                        />
                    </Card>
                </div>
            );
    }

    public createCardList() {
        let list: any = [];
        let catalog = this.catalog;
        for (let i = 0; i < catalog.publications.length; i++) {
            let newAuthor: string = "";
            let newImage: string = "";
            let newdownloadUrl: string = "";
            if (catalog.publications[i].authors[0]) {
                newAuthor = catalog.publications[i].authors[0].name;
            }
            if (catalog.publications[i].cover) {
                    newImage = catalog.publications[i].cover.url;
            }
            for (let file of catalog.publications[i].files) {
                if (file.contentType === "application/epub+zip" && newdownloadUrl === "") {
                    newdownloadUrl = file.url;
                }
            }
            let book = {
                author: newAuthor,
                downloadUrl:  newdownloadUrl,
                id: i,
                image: newImage,
                title: catalog.publications[i].title,
            };
            list.push(<this.BookCard key={i} downloadable={true} book={book} />);
        }
        return list;
    }

    public createElementList() {
        let list: any = [];
        let catalogs = this.catalog;
        for (let i = 0; i < catalogs.publications.length; i++) {
            let newAuthor: string = "";
            let newdownloadUrl: string = "";
            let newImage: string = "";
            if (catalogs.publications[i].authors[0]) {
                newAuthor = catalogs.publications[i].authors[0].name;
            }
            if (catalogs.publications[i].cover) {
                    newImage = catalogs.publications[i].cover.url;
            }
            for (let files of catalogs.publications[i].files) {
                if (files.contentType === "application/epub+zip" && newdownloadUrl === "") {
                    newdownloadUrl = files.url;
                }
            }
            let book = {
                author: newAuthor,
                downloadUrl:  newdownloadUrl,
                image: newImage,
                title: catalogs.publications[i].title,
            };
            list.push(<this.BookListElement key={i} book={book} translator={this.translator}/>);
        }
        return <div style={styles.BookListElement.container}> {list} </div>;
    }

    public componentDidMount() {
        this.store.subscribe(() => {
            this.setState({
                locale: this.store.getState().i18n.locale,
            });
        });
    }

    public render(): React.ReactElement<{}>  {
        const __ = this.translator.translate;
        const that = this;
        this.catalog = this.props.catalog;

        let listToDisplay: any;
        if (this.catalog) {
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
                    <h1 style={styles.Library.title}>{__("library.heading")}</h1>
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
                    <RaisedButton label={__("library.add")} style={styles.Library.addButton} />
                </div >

                <div style={styles.Library.list}>
                    {listToDisplay}
                </div>
            </div>
        );
    }
}
