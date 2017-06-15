import * as React from "react";

import FlatButton   from "material-ui/FlatButton";
import IconButton from "material-ui/IconButton";
import LinearProgress from "material-ui/LinearProgress";

import { lazyInject } from "readium-desktop/renderer/di";

import { Publication } from "readium-desktop/models/publication";

import { Translator }   from "readium-desktop/i18n/translator";

import RaisedButton from "material-ui/RaisedButton";

import { DownloadStatus } from "readium-desktop/models/downloadable";

interface IPublicationProps {
    publication: Publication;
    publicationId: number;
    downloadEPUB: Function;
    handleRead: Function;
    cancelDownload: Function;
}

interface IDownload {
    link: string;
    progress: number;
}

const styles = {
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
            height: 140,
            marginLeft: "5px",
        },
        image: {
            display: "inline-block",
            float: "left",
            height: 140,
            width: 91,
        },
        title: {
            margin: "10px 0px",
        },
    },
};

export default class PublicationListElement extends React.Component<IPublicationProps, null> {
    @lazyInject("translator")
    private translator: Translator;

    public render(): React.ReactElement<{}>  {
        const __ = this.translator.translate;

        const publication: Publication = this.props.publication;

        let author: string = "";
        let image: string = "";

        let id = this.props.publicationId;

        if (publication.authors[0]) {
            author = publication.authors[0].name;
        }
        if (publication.cover) {
            image = publication.cover.url;
        }

        return (
            <div style={styles.BookListElement.body}>
                <img style={styles.BookListElement.image} src={image} />
                <div style={styles.BookListElement.description}>
                    <h4 style={styles.BookListElement.title}>{publication.title}</h4>
                    <div style={styles.BookListElement.column}>
                        <p>{author}</p>
                        <p>Editeur</p>
                    </div>
                    <div style={styles.BookListElement.column}>
                            { !publication.download
                                || publication.download.status === DownloadStatus.Init ? (
                                <FlatButton
                                    label={__("publication.downloadButton")}
                                    onClick={() => {this.props.downloadEPUB(publication, id); }}/>
                            ) : publication.download.status === DownloadStatus.Downloading ? (
                                <div>
                                    <p>{__("publication.progressDownload")}</p>
                                    <LinearProgress mode="determinate"
                                        value={publication.download.progress} />
                                    <IconButton
                                        iconClassName="fa fa-times"
                                        onClick={() => {this.props.cancelDownload(publication); }}/>
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
                </div>
            </div>
        );
    }
}
