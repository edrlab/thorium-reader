import * as React from "react";
import { Store } from "redux";

import FlatButton   from "material-ui/FlatButton";

import { lazyInject } from "readium-desktop/renderer/di";

import { Publication } from "readium-desktop/models/publication";

import { Translator }   from "readium-desktop/i18n/translator";
import { IAppState }    from "readium-desktop/reducers/app";

import { Card, CardMedia, CardTitle} from "material-ui/Card";
import LinearProgress from "material-ui/LinearProgress";

import * as ReactCardFlip from "react-card-flip";

interface IPublicationState {
    locale: string;
}

interface IPublicationProps {
    publication: Publication;
    publicationId: number;
    downloadEPUB: Function;
    handleBack: Function;
    handleFront: Function;
    downloadable: boolean;
    download: IDownload;
    isFlipped: boolean;
}

interface IDownload {
    link: string;
    progress: number;
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

    @lazyInject("store")
    private store: Store<IAppState>;

    public componentDidMount() {
        this.store.subscribe(() => {
            this.setState({
                locale: this.store.getState().i18n.locale,
            });
        });

    }

    public render(): React.ReactElement<{}>  {
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
                            onMouseEnter={() => {this.props.handleFront(id); }}
                            onMouseLeave={() => {this.props.handleBack(id); }}>
                            <ReactCardFlip isFlipped={that.props.isFlipped}>
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
                                                {(this.props.download === undefined
                                                    || this.props.download.progress === -1) ? (
                                                    <FlatButton
                                                        style={styles.BookCard.downloadButton}
                                                        label={this.translator.translate("library.downloadButton")}
                                                        onClick={() => {this.props.downloadEPUB(publication, id); }}/>
                                                ) : this.props.download.progress < 100 ? (
                                                    <div>
                                                        <p>Téléchargement en cours</p>
                                                        <LinearProgress mode="determinate"
                                                            value={this.props.download.progress} />
                                                    </div>
                                                ) : (
                                                    <p>Téléchargement Terminé</p>
                                                )}
                                            </div>
                                        ) : (
                                            <div>
                                                <FlatButton
                                                style={styles.BookCard.downloadButton}
                                                label="Supprimer" />

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
