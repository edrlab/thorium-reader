import * as React from "react";
import { Store } from "redux";

import FontIcon     from "material-ui/FontIcon";
import IconButton   from "material-ui/IconButton";
import RaisedButton from "material-ui/RaisedButton";
import Snackbar     from "material-ui/Snackbar";
import { blue500 }  from "material-ui/styles/colors";

import { lazyInject } from "readium-desktop/renderer/di";

import { ipcRenderer } from "electron";
import {
    PUBLICATION_DOWNLOAD_FINISHED,
    PUBLICATION_DOWNLOAD_PROGRESS,
    PUBLICATION_DOWNLOAD_REQUEST,
    PUBLICATION_DOWNLOAD_RESPONSE,
} from "readium-desktop/events/ipc";
import {
    DownloadMessage,
    PublicationMessage,
} from "readium-desktop/models/ipc";
import { Publication } from "readium-desktop/models/publication";

import { Translator }   from "readium-desktop/i18n/translator";
import { IAppState }    from "readium-desktop/reducers/app";

import { Catalog } from "readium-desktop/models/catalog";

import { PublicationCard, PublicationListElement } from "readium-desktop/components/Publication";

interface ILibraryState {
    downloads: IDownload[];
    locale: string;
    list: boolean;
    open: boolean;
    isFlipped: boolean[];
}

interface ILibraryProps {
    catalog: Catalog;
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

export default class Library extends React.Component<ILibraryProps, ILibraryState> {
    public state: ILibraryState;

    @lazyInject("translator")
    private translator: Translator;

    @lazyInject("store")
    private store: Store<IAppState>;

    private catalog: Catalog;
    private snackBarMessage: string = "";

    constructor() {
        super();
        this.state = {
            downloads: [],
            isFlipped: [],
            open: false,
            list: false,
            locale: this.store.getState().i18n.locale,
        };

        ipcRenderer.on(PUBLICATION_DOWNLOAD_RESPONSE, (event: any, msg: PublicationMessage) => {
            console.log(msg);
        });

        ipcRenderer.on(PUBLICATION_DOWNLOAD_FINISHED, (event: any, msg: DownloadMessage) => {
            this.snackBarMessage = "Un téléchargement est terminé : " + msg.download.uuid;
            console.log(msg);
            this.setState({open: true});
        });

        ipcRenderer.on(PUBLICATION_DOWNLOAD_PROGRESS, (event: any, msg: DownloadMessage) => {
            let newdownloads = this.state.downloads;
            for (let download of newdownloads){
                if (download.link === msg.download.srcUrl) {
                    download.progress = msg.download.progress;
                    break;
                }
            }
            this.setState({downloads: newdownloads});
        });
    }

    public downloadEPUB = (newPublication: Publication, publicationId: number) => {
        if (this.state.downloads.length === 0) {
            let newDownloads: IDownload[] = [];
            for (let publication of this.catalog.publications) {
                let download: IDownload = {
                    link: publication.files[0].url,
                    progress: -1,
                };
                newDownloads.push(download);
            }
            this.setState({downloads: newDownloads}, () => {this.directDownloadEPUB(newPublication, publicationId); } );
        } else {
            this.directDownloadEPUB(newPublication, publicationId);
        }
    }

    public directDownloadEPUB = (newPublication: Publication, publicationId: number) => {
        let publicationMessage: PublicationMessage = {publication: newPublication};
        let newDownloads = this.state.downloads;
        newDownloads[publicationId].progress = 0;
        this.setState({downloads: newDownloads});
        ipcRenderer.send(PUBLICATION_DOWNLOAD_REQUEST, publicationMessage);
        this.snackBarMessage = "Un téléchargement a été lancé.";
        this.setState({open: true});
    }

    public handleFront = (id: any) => {
        let newIsFlipped = this.state.isFlipped;
        newIsFlipped[id] = true;
        this.setState({ isFlipped: newIsFlipped });
    }

    public handleBack = (id: any) => {
        let newIsFlipped = this.state.isFlipped;
        newIsFlipped[id] = false;
        this.setState({ isFlipped: newIsFlipped });
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
        let catalog = this.catalog;
        for (let i = 0; i < catalog.publications.length; i++) {
            list.push(<PublicationCard key={i}
                publicationId={i}
                downloadable={true}
                publication={catalog.publications[i]}
                downloadEPUB={this.downloadEPUB}
                handleBack={this.handleBack}
                handleFront={this.handleFront}
                download={this.state.downloads[i]}
                isFlipped={this.state.isFlipped[i]} />);
        }
        return list;
    }

    public createElementList() {
        let list: any = [];
        let catalogs = this.catalog;
        for (let i = 0; i < catalogs.publications.length; i++) {
            list.push(<PublicationListElement key={i}
                publication={catalogs.publications[i]}
                publicationId={i}
                downloadEPUB={this.downloadEPUB} />);
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
