// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as moment from "moment";

import * as React from "react";

import * as styles from "readium-desktop/renderer/assets/styles/bookDetailsDialog.css";

import * as DeleteIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px.svg";
import * as ExportIcon from "readium-desktop/renderer/assets/icons/outline-exit_to_app-24px.svg";
import * as RestoreIcon from "readium-desktop/renderer/assets/icons/outline-restore-24px.svg";

import * as dialogActions from "readium-desktop/common/redux/actions/dialog";

import Cover from "readium-desktop/renderer/components/publication/Cover";
import SVG from "readium-desktop/renderer/components/utils/SVG";

import { readerActions } from "readium-desktop/common/redux/actions";

import { withApi } from "readium-desktop/renderer/components/utils/api";

import { PublicationView } from "readium-desktop/common/views/publication";

import TagManager from "./TagManager";

interface PublicationInfoProps {
    publicationIdentifier: string;
    publication?: PublicationView;
    deletePublication?: any;
    openReader?: any;
    closeDialog?: any;
}

export class PublicationInfo extends React.Component<PublicationInfoProps, undefined> {
    public constructor(props: any) {
        super(props);

        this.handleRead = this.handleRead.bind(this);
        this.deletePublication = this.deletePublication.bind(this);
    }

    public render(): React.ReactElement<{}> {
        const { publication } = this.props;

        if (!publication) {
            return (<></>);
        }

        const formatedAuthors = publication.authors.join(", ");
        const formatedLanguages = publication.languages.join(", ");
        const formatedPublishers = publication.publishers.join(", ");
        let formatedPublishedDate = null;

        if (publication.publishedAt) {
            formatedPublishedDate = moment(publication.publishedAt).format("L");
        }

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
                {/* <li><a href=""><SVG svg={ExportIcon} />Gérer mon emprunt</a></li>
                <li><a href=""><SVG svg={RestoreIcon} />Exporter</a></li> */}
                <li>
                    <a onClick={ this.deletePublication }>
                        <SVG svg={DeleteIcon} />
                        Supprimer de la bibliothèque
                    </a>
                </li>
                </ul>
            </div>
            <div className={styles.dialog_right}>
                <h2>{publication.title}</h2>
                <div>
                    <p className={styles.author}>{formatedAuthors}</p>

                    {
                        (formatedPublishedDate) ?
                        (<p><span>Publié le</span> { formatedPublishedDate }</p>) : (<></>)
                    }
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
                            <span>Éditeur</span> { formatedPublishers } <br/>
                            <span>Langue</span> { formatedLanguages } <br/>
                            <span>Identifiant</span> { publication.workIdentifier } <br/>
                        </p>
                    </div>
                </div>
            </div>
            </>
        );
    }

    private deletePublication(e: any) {
        e.preventDefault();
        this.props.deletePublication({
            identifier: this.props.publication.identifier,
        });
        this.props.closeDialog();
    }

    private handleRead(e: any) {
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
        closeDialog: (data: any) => {
            dispatch(
                dialogActions.close(),
            );
        },
    };
};

const buildRequestData = (props: PublicationInfoProps) => {
    return {
        identifier: props.publicationIdentifier,
    };
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
            },
            {
                moduleId: "publication",
                methodId: "delete",
                callProp: "deletePublication",
            },
        ],
        mapDispatchToProps,
    },
);
