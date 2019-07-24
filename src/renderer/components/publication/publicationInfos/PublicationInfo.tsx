// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { oc } from "ts-optchain";

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

import { TranslatorProps, withTranslator } from "readium-desktop/renderer/components/utils/translator";

import { RootState } from "readium-desktop/renderer/redux/states";

import classNames from "classnames";
import * as styles from "readium-desktop/renderer/assets/styles/bookDetailsDialog.css";

interface Props extends TranslatorProps {
    publicationIdentifier: string;
    isOpds?: boolean;
    publication?: PublicationView;
    closeDialog?: any;
    getPublicationFromId?: any;
    hideControls?: boolean;
    lastAction: any;
}

interface State {
    seeMore: boolean;
    needSeeMore: boolean;
}

export class PublicationInfo extends React.Component<Props, State> {
    private descriptionWrapperRef: any;
    private descriptionRef: any;

    public constructor(props: Props) {
        super(props);

        this.state = {
            seeMore: false,
            needSeeMore: false,
        };
        this.toggleSeeMore = this.toggleSeeMore.bind(this);
    }

    public componentDidMount() {
        if (this.props.publicationIdentifier) {
            this.props.getPublicationFromId();
        }
        this.needSeeMoreButton();
    }

    public componentDidUpdate(oldProps: Props) {
        if (oldProps.publication !== this.props.publication) {
            this.needSeeMoreButton();
        }

        if (oldProps.lastAction !== this.props.lastAction
            && this.props.lastAction.moduleId === "publication"
            && this.props.lastAction.methodId === "updateTags"
        ) {
            this.props.getPublicationFromId();
        }
    }

    public render(): React.ReactElement<{}> {
        const { publication, __, translator } = this.props;

        if (!publication) {
            return (<></>);
        }

        const authors = publication.authors.map((author) => translator.translateContentField(author)).join(", ");
        const formatedLanguages = oc(publication).languages([]).join(", ");
        const formatedPublishers = oc(publication).publishers([]).join(", ");
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
            <div className={ styles.dialog_left }>
                <div className={ styles.image_wrapper }>
                    <div>
                        <Cover publication={ publication } />
                    </div>
                </div>
                { !this.props.hideControls &&
                    <Controls publication={ this.props.publication }/>
                }
            </div>
            <div className={ styles.dialog_right }>
                <h2>{ publication.title }</h2>
                <div>
                    <p className={ styles.author }>{ authors }</p>

                    {
                        (formatedPublishedDate) ?
                        (<p><span>{__("catalog.released")}</span> { formatedPublishedDate }</p>) : (<></>)
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
                    </div>

                    {publication.description && <>
                        <h3>{__("catalog.description")}</h3>
                        <div
                            ref={(ref) => this.descriptionWrapperRef = ref}
                            className={classNames(
                                styles.descriptionWrapper,
                                this.state.needSeeMore && styles.hideEnd,
                                this.state.seeMore && styles.seeMore,
                            )}
                        >
                            <p
                                ref={(ref) => this.descriptionRef = ref}
                                className={styles.description}
                            >
                                { publication.description }
                            </p>
                        </div>
                        { this.state.needSeeMore &&
                            <button aria-hidden className={styles.seeMoreButton} onClick={this.toggleSeeMore}>
                                { this.state.seeMore ? __("publication.seeLess") : __("publication.seeMore") }
                            </button>
                        }
                    </>}

                    <h3>{__("catalog.moreInfo")}</h3>

                    <p>
                        { formatedPublishers &&
                            <><span>{__("catalog.publisher")}</span> { formatedPublishers } <br/></>
                        }
                        <span>{__("catalog.lang")}</span> { __(`languages.${formatedLanguages}`) } <br/>
                        <span>{__("catalog.id")}</span> { publication.workIdentifier } <br/>
                    </p>
                    <button onClick={() => this.props.getPublicationFromId()}>lolilol</button>
                </div>
            </div>
            </>
        );
    }

    private toggleSeeMore() {
        this.setState({seeMore: !this.state.seeMore});
    }

    private needSeeMoreButton() {
        if (!this.descriptionWrapperRef || !this.descriptionRef) {
            return;
        }
        const need = this.descriptionWrapperRef.offsetHeight < this.descriptionRef.offsetHeight;
        this.setState({needSeeMore: need});
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

const mapStateToProps = (state: RootState) => {
    return {
        lastAction: state.api.lastSuccess.action.meta.api,
    };
};

const buildRequestData = (props: Props) => {
    return {
        identifier: props.publicationIdentifier || props.publication.identifier,
    };
};

export default withTranslator(withApi(
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
        mapStateToProps,
    },
));
