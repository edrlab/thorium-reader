import * as React from "react";

import FlatButton   from "material-ui/FlatButton";

import { lazyInject } from "readium-desktop/renderer/di";

import { Publication } from "readium-desktop/models/publication";

import { Translator }   from "readium-desktop/i18n/translator";

import RaisedButton from "material-ui/RaisedButton";

import { Card, CardMedia, CardTitle} from "material-ui/Card";
import LinearProgress from "material-ui/LinearProgress";

import * as ReactCardFlip from "react-card-flip";

import { DownloadStatus } from "readium-desktop/models/downloadable";

interface IPublicationState {
    isFlipped: boolean;
}

interface IPublicationProps {
    publication: Publication;
    publicationId: number;
    downloadEPUB: Function;
    downloadable: boolean;
    handleRead: Function;
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
};

export default class PublicationListElement extends React.Component<IPublicationProps, IPublicationState> {
    @lazyInject("translator")
    private translator: Translator;

    constructor() {
        super();

        this.state = {
            isFlipped: false,
        };
    }

    public handleFront = () => {
        this.setState({ isFlipped: true });
    }

    public handleBack = () => {
        this.setState({ isFlipped: false });
    }

    public render(): React.ReactElement<{}>  {
        const __ = this.translator.translate;
        const publication = this.props.publication;
        let that = this;
        let id = this.props.publicationId;

        let author: string = "";
        let image: string = "";

        if (publication.authors[0]) {
            author = publication.authors[0].name;
        }
        if (publication.cover) {
            image = publication.cover.url;
        }

        return (
            <div style={styles.BookCard.body}>
                <Card style={styles.BookCard.body}>
                    <CardMedia>
                        <div
                            style={styles.BookCard.image}
                            onMouseEnter={() => {this.handleFront(); }}
                            onMouseLeave={() => {this.handleBack(); }}>
                            <ReactCardFlip isFlipped={that.state.isFlipped}>
                                <div key="front" >
                                    <div>
                                        <img  style={styles.BookCard.image} src={image}/>
                                    </div>
                                </div>
                                <div key="back">
                                    <div
                                        style={styles.BookCard.image}
                                    >
                                        {this.props.downloadable ? (
                                            <div>
                                                {( !publication.download
                                                    || publication.download.status === DownloadStatus.Init) ? (
                                                    <FlatButton
                                                        label={__("publication.downloadButton")}
                                                        onClick={() => {this.props.downloadEPUB(publication, id); }}/>
                                                ) : publication.download.status === DownloadStatus.Downloading ? (
                                                    <div>
                                                        <p>{__("publication.progressDownload")}</p>
                                                        <LinearProgress mode="determinate"
                                                            value={publication.download.progress} />
                                                    </div>
                                                ) : publication.download.status === DownloadStatus.Downloaded ? (
                                                    <div>
                                                        <p>{__("publication.endDownload")}</p>
                                                        <RaisedButton
                                                            label={__("publication.readButton")}
                                                            onClick={() => {this.props.handleRead(); }}/>
                                                    </div>
                                                ) : publication.download.status === DownloadStatus.Failed ? (
                                                    <div>
                                                        <p>{__("publication.failedDownload")}</p>
                                                        <FlatButton
                                                        label={__("publication.downloadButton")}
                                                        onClick={() => {this.props.downloadEPUB(publication, id); }}/>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <p>{__("publication.canceledDownload")}</p>
                                                        <FlatButton
                                                        label={__("publication.downloadButton")}
                                                        onClick={() => {this.props.downloadEPUB(publication, id); }}/>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div>
                                                <FlatButton
                                                style={styles.BookCard.downloadButton}
                                                onClick={() => {this.props.handleRead(); }}
                                                label="Lire" />

                                                <FlatButton
                                                style={styles.BookCard.downloadButton}
                                                label={"Favoris"}/>
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
                        title={publication.title}
                        subtitle={author}
                    />
                </Card>
            </div>
        );
    }
}
