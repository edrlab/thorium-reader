import * as React from "react";

import FlatButton   from "material-ui/FlatButton";

import { lazyInject } from "readium-desktop/renderer/di";

import { Contributor } from "readium-desktop/models/contributor";
import { Publication } from "readium-desktop/models/publication";

import { Translator }   from "readium-desktop/i18n/translator";

import RaisedButton from "material-ui/RaisedButton";

import { Card, CardMedia, CardTitle} from "material-ui/Card";
import IconButton from "material-ui/IconButton";
import LinearProgress from "material-ui/LinearProgress";

import * as ReactCardFlip from "react-card-flip";

import { DownloadStatus } from "readium-desktop/models/downloadable";

import { Styles } from "readium-desktop/renderer/components/styles";

interface IPublicationState {
    isFlipped: boolean;
}

interface IPublicationProps {
    publication: Publication;
    publicationId: number;
    downloadable?: boolean;
    cancelDownload: Function;
    downloadEPUB: Function;
    handleRead: Function;
    deletePublication: Function;
    createCover: Function;
}

export default class PublicationListElement extends React.Component<IPublicationProps, IPublicationState> {
    @lazyInject("translator")
    private translator: Translator;

    private cover: JSX.Element;

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

    public componentWillMount() {
        this.cover = this.props.createCover(this.props.publication);
    }

    public render(): React.ReactElement<{}>  {
        const __ = this.translator.translate;
        const publication = this.props.publication;
        let that = this;
        let id = this.props.publicationId;

        let authors: string = "";
        let image: string = "";

        if (publication.authors && publication.authors.length > 0) {
            for (let author of publication.authors) {
                let newAuthor: Contributor = author;
                if (authors !== "") {
                    authors += ", ";
                }
                authors += newAuthor.name;
            }
        }
        if (publication.cover) {
            image = publication.cover.url;
        }

        return (
            <div style={Styles.BookCard.body}>
                <Card style={Styles.BookCard.body}>
                    <CardMedia>
                        <div
                            style={Styles.BookCard.image}
                            onMouseEnter={() => {this.handleFront(); }}
                            onMouseLeave={() => {this.handleBack(); }}>
                            <ReactCardFlip isFlipped={that.state.isFlipped}>
                                <div key="front" >
                                    {publication.cover ? (
                                        <img style={Styles.BookCard.image} src={publication.cover.url}/>
                                    ) : (
                                        <div>
                                            {this.props.createCover(this.props.publication)}
                                        </div>
                                    )}

                                </div>
                                <div key="back">
                                    <div
                                        style={Styles.BookCard.image}
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
                        subtitle={authors}
                    />
                </Card>
            </div>
        );
    }
}
