import * as React from "react";

import FlatButton   from "material-ui/FlatButton";
import LinearProgress from "material-ui/LinearProgress";

import { lazyInject } from "readium-desktop/renderer/di";

import { Publication } from "readium-desktop/models/publication";

import { Translator }   from "readium-desktop/i18n/translator";

import RaisedButton from "material-ui/RaisedButton";

interface IPublicationProps {
    publication: Publication;
    publicationId: number;
    downloadEPUB: Function;
    download: IDownload;
    handleRead: Function;
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
            height: 120,
            marginLeft: "5px",
        },
        image: {
            display: "inline-block",
            float: "left",
            height: 120,
            width: 78,
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
                            {(this.props.download === undefined
                                || this.props.download.progress === -1) ? (
                                <FlatButton
                                    label={__("publication.downloadButton")}
                                    onClick={() => {this.props.downloadEPUB(publication, id); }}/>
                            ) : this.props.download.progress < 100 ? (
                                <div>
                                    <p>{__("publication.progressDownload")}</p>
                                    <LinearProgress mode="determinate"
                                        value={this.props.download.progress} />
                                </div>
                            ) : (
                                <div>
                                    <p>{__("publication.endDownload")}</p>
                                    <RaisedButton
                                        label={__("publication.readButton")}
                                        onClick={() => {this.props.handleRead(); }}/>
                                </div>
                            )}
                    </div>
                </div>
            </div>
        );
    }
}
