import * as React from "react";

import FlatButton from "material-ui/FlatButton";

import { lazyInject } from "readium-desktop/renderer/di";

import { Contributor } from "readium-desktop/common/models/contributor";

import { Publication } from "readium-desktop/common/models/publication";

import { getMultiLangString } from "readium-desktop/common/models/language";

import { Translator } from "readium-desktop/common/services/translator";

import { Card, CardMedia, CardTitle} from "material-ui/Card";
import IconButton from "material-ui/IconButton";
import LinearProgress from "material-ui/LinearProgress";

import * as ReactCardFlip from "react-card-flip";

import { DownloadStatus } from "readium-desktop/common/models/downloadable";

import { Styles } from "readium-desktop/renderer/components/styles";

import { Cover } from "readium-desktop/renderer/components/Publication/index";

import * as LibraryStyles from "readium-desktop/renderer/assets/styles/library.css";

interface IPublicationState {
    isFlipped: boolean;
}

interface IPublicationProps {
    publication: Publication;
    publicationId: number;
    downloading: boolean;
    downloadProgress?: number;
    cancelDownload: any;
    handleRead: any;
    deletePublication: any;
    openInfoDialog: (publication: Publication) => void;
    openReturnDialog: (publication: Publication) => void;
    openRenewDialog: (publication: Publication) => void;
}

export default class PublicationListElement extends React.Component<IPublicationProps, IPublicationState> {
    @lazyInject("translator")
    private translator: Translator;

    constructor(props: IPublicationProps) {
        super(props);

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
        // TODO: should get language from view state? (user preferences)
        const lang = "en";

        const __ = this.translator.translate.bind(this.translator);
        const publication = this.props.publication;
        const that = this;
        const id = this.props.publicationId;
        let authors: string = "";
        let image: string = "";

        if (publication.authors && publication.authors.length > 0) {
            for (const author of publication.authors) {
                const newAuthor: Contributor = author;
                if (authors !== "") {
                    authors += ", ";
                }
                authors += getMultiLangString(newAuthor.name, lang);
            }
        }
        if (publication.cover) {
            image = publication.cover.url;
        }

        return (
            <div className={LibraryStyles.book_card}>
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
                                        <div style={Styles.BookCard.image}>
                                            <Cover publication={publication}/>
                                        </div>
                                    )}
                                </div>
                                <div key="back">
                                    <div
                                        style={Styles.BookCard.image}
                                    >
                                        {this.props.downloading ? (
                                            <div>
                                                <div>
                                                    <p>{__("publication.progressDownload")}</p>
                                                    <LinearProgress mode="determinate"
                                                        value={this.props.downloadProgress} />
                                                    <FlatButton
                                                        style={Styles.BookCard.downloadButton}
                                                        onClick={() => {this.props.cancelDownload(publication); }}
                                                        label={__("publication.cancelDownloadButton")} />
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                {!publication.lcp ||
                                                 (publication.lcp
                                                    && publication.lcp.rights.end
                                                    && new Date(publication.lcp.rights.end).getTime() > Date.now()) ? (
                                                    <FlatButton
                                                    style={Styles.BookCard.downloadButton}
                                                    onClick={() => {this.props.handleRead(publication); }}
                                                    label={__("publication.readButton")} />
                                                ) : (
                                                    <p> {__("publication.notReadableLcp")} </p>
                                                )}

                                                {publication.lcp && (
                                                    <>
                                                        <FlatButton
                                                        style={Styles.BookCard.downloadButton}
                                                        onClick={() => {this.props.openInfoDialog(publication); }}
                                                        label={__("publication.infoButton")} />
                                                        <FlatButton
                                                        style={Styles.BookCard.downloadButton}
                                                        onClick={() => {this.props.openRenewDialog(publication); }}
                                                        label={__("publication.renewButton")} />
                                                        <FlatButton
                                                        style={Styles.BookCard.downloadButton}
                                                        onClick={() => {this.props.openReturnDialog(publication); }}
                                                        label={__("publication.returnButton")} />
                                                    </>
                                                )}

                                                <FlatButton
                                                style={Styles.BookCard.downloadButton}
                                                onClick={() => {this.props.deletePublication(publication); }}
                                                label={__("publication.deleteButton")}/>
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
                        title={getMultiLangString(publication.title, lang)}
                        subtitle={authors}
                    />
                </Card>
            </div>
        );
    }
}
