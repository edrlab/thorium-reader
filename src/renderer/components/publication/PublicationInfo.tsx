import * as React from "react";

import * as styles from "readium-desktop/renderer/assets/styles/bookDetailsDialog.css";

import * as DeleteIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px.svg";
import * as ExportIcon from "readium-desktop/renderer/assets/icons/outline-exit_to_app-24px.svg";
import * as RestoreIcon from "readium-desktop/renderer/assets/icons/outline-restore-24px.svg";

import Cover from "readium-desktop/renderer/components/publication/Cover";
import SVG from "readium-desktop/renderer/components/utils/SVG";

import { readerActions } from "readium-desktop/common/redux/actions";

import { withApi } from "readium-desktop/renderer/components/utils/api";

import { PublicationView } from "readium-desktop/common/views/publication";

import TagManager from "./TagManager";

interface PublicationInfoProps {
    publicationIdentifier: string;
    publication?: PublicationView;
    openReader?: any;
}

export class PublicationInfo extends React.Component<PublicationInfoProps, undefined> {
    public constructor(props: any) {
        super(props);

        this.handleRead = this.handleRead.bind(this);
    }

    public render(): React.ReactElement<{}> {
        const { publication } = this.props;

        if (!publication) {
            return (<></>);
        }

        const authors = publication.authors.join(", ");
        const languages = publication.languages.join(", ");

        return (
            <>
            <div className={styles.dialog_left}>
                <div className={styles.image_wrapper}>
                    <div>
                        <Cover publication={publication} />
                    </div>
                </div>
                <a  onClick={this.handleRead} className={styles.lire}>Lire</a>
                <ul className={styles.liens}>
                <li><a href=""><SVG svg={ExportIcon} />Gérer mon emprunt</a></li>
                <li><a href=""><SVG svg={RestoreIcon} />Exporter</a></li>
                <li>
                    <a href="">
                        <SVG svg={DeleteIcon} />
                        Supprimer de la bibliothèque
                    </a>
                </li>
                </ul>
            </div>
            <div className={styles.dialog_right}>
                <h2>{publication.title}</h2>
                <div>
                    <p className={styles.author}>{authors}</p>
                    <p><span>Publié le</span> 12/03/2018</p>
                    <div className={styles.tags}>
                        <div className={styles.tag_list}>
                            <span>Tags</span>
                            <TagManager
                                publicationIdentifier={this.props.publication.identifier}
                                tags={this.props.publication.tags}
                            />
                        </div>

                        {publication.description && <>
                            <h3>Description</h3>
                            <p className={styles.description}>{ publication.description }</p>
                        </>}

                        <h3>Plus d'informations</h3>

                        <p>
                            <span>Éditeur</span> { publication.editor } <br/>
                            <span>Langue</span> { languages } <br/>
                            <span>Identifiant</span> { publication.identifier } <br/>
                        </p>
                    </div>
                </div>
            </div>
            </>
        );
    }

    public handleRead(e: any) {
        e.preventDefault();

        this.props.openReader(this.props.publication);
    }
}

const mapDispatchToProps = (dispatch: any, __1: PublicationInfoProps) => {
    return {
        openReader: (publication: PublicationView) => {
            dispatch({
                type: readerActions.ActionType.OpenRequest,
                payload: {
                    publication: {
                        identifier: publication.identifier,
                    },
                },
            });
        },
    };
};

const buildRequestData = (props: PublicationInfoProps) => {
    return {
        identifier: props.publicationIdentifier,
    }
};

export default withApi(
    PublicationInfo,
    {
        operations: [
            {
                moduleId: "publication",
                methodId: "get",
                resultProp: "publication",
                buildRequestData,
                onLoad: true,
            }
        ],
        mapDispatchToProps,
    }
);
