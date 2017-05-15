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

import * as ReactCardFlip from "react-card-flip";

import * as request from "request";

import { RequestResponse } from "request";

import { default as Parser } from "opds-feed-parser";

interface ILibraryState {
    locale: string;
    list: boolean;
    library: boolean;
    books: any;
    isFlipped: boolean[];
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
        request.get(url, (error: any, response: RequestResponse, body: any) => {
            response.pipe(file);
        });
}

export default class Library extends React.Component<undefined, ILibraryState> {
    public state: ILibraryState;

    @lazyInject("translator")
    private translator: Translator;

    @lazyInject("store")
    private store: Store<IAppState>;

    constructor() {
        super();
        this.state = {
            books: undefined,
            isFlipped: [false, false, false],
            library : true,
            list: false,
            locale: this.store.getState().i18n.locale,
        };
        this.handleSync();
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
                        <ReactCardFlip isFlipped={that.state.isFlipped[id]}>
                            <CardMedia key="front" >
                                <div
                                    onMouseEnter={() => {this.handleFront(id); }}
                                    onMouseLeave={() => {this.handleBack(id); }}
                                >
                                    <img  style={styles.BookCard.image} src={book.image}/>
                                </div>
                            </CardMedia>
                            <CardMedia key="back">
                                <div
                                    onMouseEnter={() => {this.handleFront(id); }}
                                    onMouseLeave={() => {this.handleBack(id); }}
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
                            </CardMedia>
                        </ReactCardFlip>
                        <CardTitle
                            titleStyle={{whiteSpace: "nowrap", overflow: "hidden"}}
                            subtitleStyle={{whiteSpace: "nowrap", overflow: "hidden"}}
                            title={book.title}
                            subtitle={book.author}
                            style={styles.BookCard.titleCard}
                        />
                    </Card>
                </div>
            );
    }

    public createCardList() {
        let list: any = [];
        let books = this.state.books;
        for (let i = 0; i < books.entries.length; i++) {
            let newAuthor: string = "";
            let newImage: string = "";
            let newdownloadUrl: string = "";
            if (books.entries[i].authors[0]) {
                newAuthor = books.entries[i].authors[0].name;
            }
            for (let link of books.entries[i].links) {
                let rel = link.rel.split("/");
                if ((rel[rel.length - 1] === "cover" || rel[rel.length - 1] === "image") && newImage === "") {
                    newImage = link.href;
                }
                if (link.type === "application/epub+zip" && newdownloadUrl === "") {
                    newdownloadUrl = link.href;
                }
            }
            let book = {
                author: newAuthor,
                downloadUrl:  newdownloadUrl,
                id: i,
                image: newImage,
                title: books.entries[i].title,
            };
            list.push(<this.BookCard key={i} downloadable={true} book={book} />);
        }
        return list;
    }

    public createElementList() {
        let list: any = [];
        let books = this.state.books;
        for (let i = 0; i < books.entries.length; i++) {
            let newAuthor: string = "";
            let newdownloadUrl: string = "";
            let newImage: string = "";
            if (books.entries[i].authors[0]) {
                newAuthor = books.entries[i].authors[0].name;
            }
            for (let link of books.entries[i].links) {
                let rel = link.rel.split("/");
                if (rel[rel.length - 1] === "thumbnail" && newImage === "") {
                    newImage = link.href;
                }
                if (link.type === "application/epub+zip" && newdownloadUrl === "") {
                    newdownloadUrl = link.href;
                }
            }
            let book = {
                author: newAuthor,
                downloadUrl:  newdownloadUrl,
                image: newImage,
                title: books.entries[i].title,
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

        let listToDisplay: any;
        if (this.state.books) {
            if (this.state.list) {
                listToDisplay = this.createElementList();
            } else {
                listToDisplay = this.createCardList();
            }
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

    private handleSync() {
        let url = "http://fr.feedbooks.com/books/top.atom?category=FBFIC019000&lang=fr";

        let parser = new Parser();
        request(url, (error: any, response: any, body: any) => {
            let promise = parser.parse(body);
            promise.then((result: any) => {
                this.setState({books: result});
            });
        });
    }
}
