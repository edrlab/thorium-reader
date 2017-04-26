import * as React from "react";
import { Store } from "redux";

import { Card, CardMedia, CardTitle} from "material-ui/Card";
import FontIcon from "material-ui/FontIcon";
import IconButton from "material-ui/IconButton";
import RaisedButton from "material-ui/RaisedButton";
import { blue500 } from "material-ui/styles/colors";

import { lazyInject } from "../di";
import { Translator } from "../i18n/translator";
import { IAppState } from "../reducers/app";

// DANIEL - IPC test
import { ipcRenderer } from "electron";

interface ILibraryState {
    locale: string;
    list: boolean;
}

const styles = {
    BookCard: {
        body: {
            display: "inline-block",
            margin: "5px 5px",
            textAlign: "center",
            width: 210,
        },
        image: {
            height: 320,
        },
        title: {
            overflow: "hidden",
            whiteSpace: "nowrap",
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

const books = [
    {
        author: "Antoine de Saint-Exupéry",
        editor: "Folio Junior",
        format: "Epub 3",
        image: "prince.jpg",
        size: "15,8 Mo",
        title: "Le petit prince",
    },
    {
        author: "H.P Lovecraft",
        editor: "Folio",
        format: "Epub 3",
        image: "chtulhu.jpg",
        size: "17,3 Mo",
        title: "Le mythe de Chtulhu",
    },
    {
        author: "Maeda Jun & Asami Yuriko",
        editor: "Folio",
        format: "Epub 3",
        image: "angel.jpg",
        size: "30,1 Mo",
        title: "Angel Beats",
    },
    {
        author: "George Orwell",
        editor: "Folio",
        image: "1984.jpg",
        title: "1984",
    },
    {
        author: "Jonas Johanson",
        editor: "Pocket",
        image: "vieux.jpg",
        title: "Le vieux qui ne voulait pas fêter son anniversaire",
    },
    {
        author: "Knut Hamsun",
        editor: "Biblio",
        format: "Epub 2",
        image: "faim.jpeg",
        size: "11,9 Mo",
        title: "La Faim",
    },
    {
        author: "Isaac Asimov",
        editor: "J'ai lu",
        image: "robot.jpg",
        title: "Le cycle des robots",
    },
];

function BookListElement (props: any) {
        const book = props.book;
        const image = "images/" + book.image;

        return (
            <div style={styles.BookListElement.body}>
                <img style={styles.BookListElement.image} src={image} />
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
                </div>
            </div>
        );
};

function BookCard (props: any) {
        const book = props.book;
        const image = "images/" + book.image;

        return (
            <Card style={styles.BookCard.body}>
                <CardMedia>
                    <img style={styles.BookCard.image} src={image} />
                </CardMedia>
                <CardTitle
                    titleStyle={{whiteSpace: "nowrap", overflow: "hidden"}}
                    title={book.title}
                    subtitle={book.author}
                />
            </Card>
        );
};

export default class Library extends React.Component<undefined, ILibraryState> {
    public state: ILibraryState;

    @lazyInject(Translator)
    private translator: Translator;

    @lazyInject("store")
    private store: Store<IAppState>;

    constructor() {
        super();
        this.state = {
            list: false,
            locale: this.store.getState().i18n.locale,
        };
    }

    // DANIEL - IPC test
    public _handleClick() {
        console.log("CLICK");

        // let response = ipcRenderer.sendSync('synchronous-message', 'RENDERER SYNC');
        // console.log(response);

        ipcRenderer.on("asynchronous-reply", (event, arg) => {
            console.log(arg);
        });

        ipcRenderer.send("asynchronous-message", "RENDERER ASYNC");
    }

    public bookCardList() {
        let list: any = [];
        for (let i = 0; i < books.length; i++) {
            list.push(<BookCard key={i} book={books[i]} />);
        }
        return list;
    }

    public bookListElementList() {
        let list: any = [];
        for (let i = 0; i < books.length; i++) {
            list.push(<BookListElement key={i} book={books[i]} />);
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

        if (this.state.list) {
            listToDisplay = this.bookListElementList();
        } else {
            listToDisplay = this.bookCardList();
        }

        return (
            <div>
                <RaisedButton label="DANIEL - IPC test" onClick={this._handleClick} />
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
                    <RaisedButton label="Ajouter à la bibliotheque" style={styles.Library.addButton} />
                </div >

                <div style={styles.Library.list}>
                    {listToDisplay}
                </div>
            </div>
        );
    }
}
