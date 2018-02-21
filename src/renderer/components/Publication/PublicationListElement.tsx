import * as React from "react";

import FlatButton from "material-ui/FlatButton";
import IconButton from "material-ui/IconButton";
import LinearProgress from "material-ui/LinearProgress";

import { lazyInject } from "readium-desktop/renderer/di";

import { Publication } from "readium-desktop/common/models/publication";

import { getMultiLangString } from "readium-desktop/common/models/language";

import { Translator } from "readium-desktop/common/services/translator";

import RaisedButton from "material-ui/RaisedButton";

import { DownloadStatus } from "readium-desktop/common/models/downloadable";

import { Styles } from "readium-desktop/renderer/components/styles";

import { Cover } from "readium-desktop/renderer/components/Publication/index";

interface IPublicationProps {
    publication: Publication;
    publicationId: number;
    downloading: boolean;
    downloadProgress?: number;
    handleRead: any;
    cancelDownload: any;
    deletePublication: any;
    openInfoDialog: (publication: Publication) => void;
}

interface IDownload {
    link: string;
    progress: number;
}

export default class PublicationListElement extends React.Component<IPublicationProps, null> {
    @lazyInject("translator")
    private translator: Translator;

    public render(): React.ReactElement<{}>  {
        // TODO: should get language from view state? (user preferences)
        const lang = "en";

        const __ = this.translator.translate.bind(this.translator);

        const publication: Publication = this.props.publication;

        let author: string = "";
        let image: string = "";

        const id = this.props.publicationId;

        if (publication.authors && publication.authors.length > 0) {
            author = getMultiLangString(publication.authors[0].name, lang);
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
                    <h4 style={Styles.BookListElement.title}>{getMultiLangString(publication.title, lang)}</h4>
                    <div style={Styles.BookListElement.column}>
                        <p>{author}</p>
                        <p>Editeur</p>
                    </div>
                    <div style={Styles.BookListElement.column}>
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
                                    <FlatButton
                                    style={Styles.BookCard.downloadButton}
                                    onClick={() => {this.props.handleRead(publication); }}
                                    label={__("publication.readButton")} />

                                    {publication.lcp && (
                                        <FlatButton
                                        style={Styles.BookCard.downloadButton}
                                        onClick={() => {this.props.openInfoDialog(publication); }}
                                        label={__("publication.infoButton")} />
                                    )}

                                    <FlatButton
                                    style={Styles.BookCard.downloadButton}
                                    onClick={() => {this.props.deletePublication(publication); }}
                                    label={__("publication.deleteButton")}/>
                                </div>
                            )
                        }
                    </div>
                </div>
            </div>
        );
    }
}
