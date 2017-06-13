import * as React from "react";

import FontIcon     from "material-ui/FontIcon";
import IconButton   from "material-ui/IconButton";
import RaisedButton from "material-ui/RaisedButton";
import Snackbar     from "material-ui/Snackbar";
import { blue500 }  from "material-ui/styles/colors";

import { Store } from "redux";

import * as publicationDownloadActions from "readium-desktop/actions/publication-download";

import { Publication } from "readium-desktop/models/publication";

import { lazyInject } from "readium-desktop/renderer/di";
import { RendererState } from "readium-desktop/renderer/reducers";

import * as windowActions from "readium-desktop/renderer/actions/window";

import { Translator }   from "readium-desktop/i18n/translator";

import { Catalog } from "readium-desktop/models/catalog";

import { PublicationCard, PublicationListElement } from "readium-desktop/renderer/components/Publication/index";

interface ILibraryState {
    list: boolean;
    open: boolean;
}

interface LibraryProps {
    catalog: Catalog;
    handleRead: Function;
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

    private snackBarMessage: string = "";
    // private lastTimeUpdated = new Date().getTime() / 1000;

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

    // Create the download list if it doesn't exist then start the download
    public downloadEPUB = (newPublication: Publication, publicationId: number) => {
        this.store.dispatch(publicationDownloadActions.add(newPublication));

        this.snackBarMessage = this.__("library.startDownload");
        this.setState({open: true});
    }

    public handleRequestClose = () => {
        this.setState({ open: false });
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
                downloadable={true}
                publication={this.props.catalog.publications[i]}
                downloadEPUB={this.downloadEPUB}
                handleRead={this.props.handleRead.bind(this)} />);
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
                handleRead={this.props.handleRead.bind(this)} />);
        }
        return <div style={styles.BookListElement.container}> {list} </div>;
    }

    /*public shouldComponentUpdate(nextProps: LibraryProps, nextState: ILibraryState): boolean {
        if (nextState.open !== this.state.open
            || nextState.list !== this.state.list) {
                return true;
        } else {
            if ((new Date().getTime() / 1000) - this.lastTimeUpdated > 1 || nextState.open !== this.state.open) {
                this.lastTimeUpdated = new Date().getTime() / 1000;
                return true;
            } else {
                return false;
            }
        }
    }*/

    public render(): React.ReactElement<{}>  {
        const that = this;
        console.log(this.props.catalog);
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

                <Snackbar
                        open={this.state.open}
                        message= {this.snackBarMessage}
                        autoHideDuration={4000}
                        onRequestClose={this.handleRequestClose}
                    />
            </div>
        );
    }
}
