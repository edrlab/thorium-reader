import { MinLength, validate } from "class-validator";
import * as React from "react";
import { Store } from "redux";

import { Card, CardHeader, CardMedia, CardText, CardTitle, CardActions } from "material-ui/Card";
import {Tabs, Tab} from 'material-ui/Tabs';
import FlatButton from 'material-ui/FlatButton';
import DropDownMenu from "material-ui/DropDownMenu";
import FontIcon from "material-ui/FontIcon";
import IconButton from "material-ui/IconButton";
import IconMenu from "material-ui/IconMenu";
import MenuItem from "material-ui/MenuItem";
import RaisedButton from "material-ui/RaisedButton";
import { blue500 } from "material-ui/styles/colors";
import NavigationExpandMoreIcon from "material-ui/svg-icons/navigation/expand-more";
import TextField from "material-ui/TextField";
import { Toolbar, ToolbarGroup, ToolbarSeparator, ToolbarTitle } from "material-ui/Toolbar";

import { setLocale } from "../actions/i18n";
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
        body:{
            width: 210,
            margin: "5px 5px",
            textAlign: "center",
            display: "inline-block"
        },
        image: {
            height:320
        },
        title: {
            whiteSpace: "nowrap",
            overflow: "hidden"
        }        
    },
    BookListElement: {
        body:{
            margin: "5px 0px",
            boxShadow: "rgba(0, 0, 0, 0.117647) 0px 1px 6px, rgba(0, 0, 0, 0.117647) 0px 1px 4px",
            fontFamily: "Roboto, sans-serif",
            width:"1200px"
        },
        image: {
            display:"inline-block",
            float:"left", 
            height:120, 
            width:78
        },
        description:{
            display:"inline-block", 
            height:120, 
            marginLeft: "5px"
        },
        title: {
            margin:"10px 0px"
        },
        column: {
            display: "inline-block",
            width: "250px"
        },
        container: {
            maxWidth: 1200,
            display:"inline-block",
            textAlign:"left"
        }
    },
    Library: {
        displayButton: {
            float:"right"
        },
        title: {
            display:"inline-block"
        },
        list: {
            textAlign:"center"
        },
        addButton: {
            float:"right",
            marginTop: "6px"
        }
    }
}

const books = [
    {
        title:"Le petit prince",
        author:"Antoine de Saint-Exupéry",
        image:"prince.jpg",
        editor:"Folio Junior",
        size: "15,8 Mo",
        format: "Epub 3"
    },
    {
        title:"Le mythe de Chtulhu",
        author:"H.P Lovecraft",
        image:"chtulhu.jpg",
        editor:"Folio",
        size: "17,3 Mo",
        format: "Epub 3"
    },
    {
        title:"Angel Beats",
        author:"Maeda Jun & Asami Yuriko",
        image:"angel.jpg",
        editor:"Folio",
        size: "30,1 Mo",
        format: "Epub 3"
    },
    {
        title:"1984",
        author:"George Orwell",
        image:"1984.jpg",
        editor:"Folio"
    },
    {
        title:"Le vieux qui ne voulait pas fêter son anniversaire",
        author:"Jonas Johanson",
        image:"vieux.jpg",
        editor:"Pocket"
    },
    {
        title:"La Faim",
        author:"Knut Hamsun",
        image:"faim.jpeg",
        editor:"Biblio",
        size: "11,9 Mo",
        format: "Epub 2"
    },
    {
        title:"Le cycle des robots",
        author:"Isaac Asimov",
        image:"robot.jpg",
        editor:"J'ai lu"
    }
]

function BookListElement (props:any){
        var book = props.book;
        var image = "images/" + book.image;

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

function BookCard (props:any){
        var book = props.book;
        var image = "images/" + book.image;
        

        return (
            <Card style={styles.BookCard.body}>
                <CardMedia>
                    <img style={styles.BookCard.image} src={image} />
                </CardMedia>
                <CardTitle titleStyle={{whiteSpace: "nowrap", overflow: "hidden"}} title={book.title} subtitle={book.author} />
            </Card>
        );
};


export default class Library extends React.Component<undefined, ILibraryState> {
    public state: ILibraryState;

    @lazyInject(Translator)
    private translator: Translator;

    @lazyInject("store")
    private store: Store<IAppState>;
    private displayList: boolean;

    constructor() {
        super();
        this.state = {
            locale: this.store.getState().i18n.locale,
            list: false,
        };

        this.handleLocaleChange = this.handleLocaleChange.bind(this);
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

    public bookCardList(){
        var list: any = [];
        for (var i = 0; i < books.length; i++){
            list.push(<BookCard key={i} book={books[i]} />)
        }
        return list;
    }

    public bookListElementList(){
        var list: any = [];
        for (var i = 0; i < books.length; i++){
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
        var that = this;
        var listToDisplay: any;

        if (this.state.list){
            listToDisplay = this.bookListElementList();
        }
        else {
            listToDisplay = this.bookCardList();
        }

        return (
            <div>
                <Toolbar>
                    <ToolbarGroup firstChild={true}>
                        <DropDownMenu value={this.state.locale} onChange={this.handleLocaleChange}>
                            <MenuItem value="en" primaryText="English" />
                            <MenuItem value="fr" primaryText="French" />
                        </DropDownMenu>
                    </ToolbarGroup>
                    <ToolbarGroup>
                        <ToolbarTitle text="Options" />
                        <FontIcon className="muidocs-icon-custom-sort" />
                        <ToolbarSeparator />
                        <IconMenu
                        iconButtonElement={
                            <IconButton touch={true}>
                                <FontIcon
                                    className="fa fa-home"
                                    color={blue500} />
                            </IconButton>
                        }
                        >
                            <MenuItem primaryText="Download" />
                            <MenuItem primaryText="More Info" />
                        </IconMenu>
                    </ToolbarGroup>
                </Toolbar>
                <RaisedButton label="DANIEL - IPC test" onClick={this._handleClick} />
                <div>
                    <h1 style={styles.Library.title}>{__("library.heading")}</h1>

                    <IconButton style={styles.Library.displayButton} touch={true} onClick={function(){that.setState({list: true});}}>
                        <FontIcon className="fa fa-list" color={blue500} />
                    </IconButton>
                    <IconButton style={styles.Library.displayButton} touch={true}  onClick={function(){that.setState({list: false});}}>
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

    private handleLocaleChange(event: any, index: any, locale: string) {
        this.store.dispatch(setLocale(locale));
    }
}
