import * as React from "react";

import FlatButton   from "material-ui/FlatButton";
import IconButton from "material-ui/IconButton";
import LinearProgress from "material-ui/LinearProgress";

import { lazyInject } from "readium-desktop/renderer/di";

import { Publication } from "readium-desktop/common/models/publication";

import { Translator }   from "readium-desktop/common/services/translator";

import RaisedButton from "material-ui/RaisedButton";

import { DownloadStatus } from "readium-desktop/common/models/downloadable";

import { Styles } from "readium-desktop/renderer/components/styles";

import { Cover } from "readium-desktop/renderer/components/Publication/index";

interface IPublicationProps {
    publication: Publication;
    publicationId: number;
    downloadable?: boolean;
    downloadEPUB: Function;
    handleRead: Function;
    cancelDownload: Function;
    deletePublication: Function;
}

interface IDownload {
    link: string;
    progress: number;
}

export default class PublicationListElement extends React.Component<IPublicationProps, null> {
    @lazyInject("translator")
    private translator: Translator;

    public render(): React.ReactElement<{}>  {
        const __ = this.translator.translate.bind(this.translator);

        const publication: Publication = this.props.publication;

        let author: string = "";
        let image: string = "";

        let id = this.props.publicationId;

        if (publication.authors && publication.authors.length > 0) {
            author = publication.authors[0].name;
        }
        if (publication.cover) {
            image = publication.cover.url;
        }

        return (
            <div style={Styles.BookListElement.body}>
                {publication.cover ? (
                    <img style={Styles.BookListElement.image} src={publication.cover.url}/>
                ) : (
                    <div style={Styles.BookListElement.image}>
                        <Cover publication={publication}/>
                    </div>
                )}
                <div style={Styles.BookListElement.description}>
                    <h4 style={Styles.BookListElement.title}>{publication.title}</h4>
                    <div style={Styles.BookListElement.column}>
                        <p>{author}</p>
                        <p>Editeur</p>
                    </div>
                    <div style={Styles.BookListElement.column}>
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
                                            <IconButton
                                                iconClassName="fa fa-times"
                                                onClick={() => {this.props.cancelDownload(publication); }}/>
                                        </div>
                                    ) : publication.download.status === DownloadStatus.Downloaded ? (
                                        <div>
                                            <p>{__("publication.endDownload")}</p>
                                            <RaisedButton
                                                label={__("publication.readButton")}
                                                onClick={() => {this.props.handleRead(publication); }}/>
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
                                    style={Styles.BookCard.downloadButton}
                                    onClick={() => {this.props.handleRead(publication); }}
                                    label="Lire" />

                                    <FlatButton
                                    style={Styles.BookCard.downloadButton}
                                    onClick={() => {this.props.deletePublication(publication.identifier); }}
                                    label={"Supprimer"}/>
                                </div>
                            )
                        }
                    </div>
                </div>
            </div>
        );
    }
}
