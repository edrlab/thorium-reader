// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as moment from "moment";

import * as React from "react";

import * as dialogActions from "readium-desktop/common/redux/actions/dialog";

import Cover from "readium-desktop/renderer/components/publication/Cover";

import { withApi } from "readium-desktop/renderer/components/utils/api";

import { PublicationView } from "readium-desktop/common/views/publication";

import TagManager from "readium-desktop/renderer/components/publication/TagManager";

import CatalogControls from "./catalogControls";
import CatalogLcpControls from "./catalogLcpControls";
import OpdsControls from "./opdsControls";

import * as styles from "readium-desktop/renderer/assets/styles/bookDetailsDialog.css";

import { TranslatorProps } from "readium-desktop/renderer/components/utils/translator";

interface PublicationInfoProps extends TranslatorProps {
    publicationIdentifier: string;
    isOpds?: boolean;
    publication?: PublicationView;
    closeDialog?: any;
    getPublicationFromId?: any;
    hideControls?: boolean;
}

export class PublicationInfo extends React.Component<PublicationInfoProps, undefined> {
    public componentDidMount() {
        if (this.props.publicationIdentifier) {
            this.props.getPublicationFromId();
        }
    }

    public render(): React.ReactElement<{}> {
        const { publication, __ } = this.props;

        if (!publication) {
            return (<></>);
        }

        const formatedAuthors = publication.authors.join(", ");
        const formatedLanguages = publication.languages.join(", ");
        const formatedPublishers = publication.publishers.join(", ");
        let formatedPublishedDate = null;

        let Controls: any = CatalogControls;
        if (this.props.isOpds) {
            Controls = OpdsControls;
        }
        if (publication.lcp) {
            Controls = CatalogLcpControls;
        }

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
                { !this.props.hideControls &&
                    <Controls publication={this.props.publication}/>
                }
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
                                canModifyTag={!this.props.isOpds}
                            />
                        </div>

                        {publication.description && <>
                            <h3>Description</h3>
                            <p className={styles.description}>{ publication.description }</p>
                        </>}

                        <h3>Plus d'informations</h3>

                        <p>
                            <span>Éditeur</span> { formatedPublishers } <br/>
                            <span>Langue</span> { __(`languages.${formatedLanguages}`) } <br/>
                            <span>Identifiant</span> { publication.workIdentifier } <br/>
                        </p>
                    </div>
                </div>
            </div>
            </>
        );
    }
}

const mapDispatchToProps = (dispatch: any) => {
    return {
        closeDialog: () => {
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
                callProp: "getPublicationFromId",
                buildRequestData,
            },
        ],
        mapDispatchToProps,
    },
);
