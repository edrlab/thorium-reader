import * as React from "react";

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
} from "readium-desktop/events/ipc";
import {
    DownloadMessage,
    PublicationMessage,
} from "readium-desktop/models/ipc";
import { Publication } from "readium-desktop/models/publication";

import { Translator }   from "readium-desktop/i18n/translator";

import { Catalog } from "readium-desktop/models/catalog";

import { PublicationCard, PublicationListElement } from "readium-desktop/components/Publication/index";

interface ILibraryState {
    downloads: IDownload[];
    list: boolean;
    open: boolean;
}

interface LibraryProps {
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

export default class Library extends React.Component<LibraryProps, ILibraryState> {
    public state: ILibraryState;
    public props: LibraryProps;

    @lazyInject("translator")
    private translator: Translator;

    private  __ = this.translator.translate;

    private snackBarMessage: string = "";
    // private lastTimeUpdated = new Date().getTime() / 1000;

    constructor(props: LibraryProps) {
        super(props);

        this.state = {
            downloads: [],
            open: false,
            list: false,
        };

        ipcRenderer.on(PUBLICATION_DOWNLOAD_FINISHED, (event: any, msg: DownloadMessage) => {
            this.snackBarMessage = this.__("library.endDownload");
            this.setState({open: true});
        });

        ipcRenderer.on(PUBLICATION_DOWNLOAD_PROGRESS, (event: any, msg: DownloadMessage) => {
            let newdownloads = this.state.downloads;
            for (let download of newdownloads){
                if (download.link === msg.download.srcUrl) {
                    if (msg.download.progress !== download.progress) {
                        download.progress = msg.download.progress;
                        this.setState({downloads: newdownloads});
                    }
                    break;
                }
            }
        });
    }

    public downloadEPUB = (newPublication: Publication, publicationId: number) => {
        if (this.state.downloads.length === 0) {
            let newDownloads: IDownload[] = [];
            for (let publication of this.props.catalog.publications) {
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
                download={this.state.downloads[i]}/>);
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
                download={this.state.downloads[i]} />);
        }
        return <div style={styles.BookListElement.container}> {list} </div>;
    }

    /*public shouldComponentUpdate(nextProps: any, nextState: any) {
        if (this.compareDownloads(nextState.downloads, this.state.downloads )) {
            if ((new Date().getTime() / 1000) - this.lastTimeUpdated > 1 || nextState.open !== this.state.open) {
                this.lastTimeUpdated = new Date().getTime() / 1000;
                return true;
            } else {
                return false;
            }
        }
        return true;
    }*/

    public compareDownloads(array1: IDownload[], array2: IDownload[]): boolean {
        if (!array1 || !array2) {
            return false;
        }

        if (array1.length !== array2.length) {
            return false;
        }

        for (let i = 0; i < array1.length; i++) {
            if (array1[i].progress !== array2[i].progress) {
                return false;
            }
        }
        return true;
    }

    public render(): React.ReactElement<{}>  {
        const that = this;
        console.log(this.props.catalog);
        let listToDisplay: any;
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
                    <RaisedButton label={this.__("library.add")} style={styles.Library.addButton} />
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
