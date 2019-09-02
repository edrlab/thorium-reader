// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import classNames from "classnames";
import * as moment from "moment";
import * as React from "react";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import {
    TPublicationApiGet, TPublicationApiGet_result,
} from "readium-desktop/main/api/publication";
import * as styles from "readium-desktop/renderer/assets/styles/bookDetailsDialog.css";
import Cover from "readium-desktop/renderer/components/publication/Cover";
import TagManager from "readium-desktop/renderer/components/publication/TagManager";
import { withApi } from "readium-desktop/renderer/components/utils/api";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/translator";
import { RootState } from "readium-desktop/renderer/redux/states";
import { oc } from "ts-optchain";

import CatalogControls from "./catalogControls";
import CatalogLcpControls from "./catalogLcpControls";
import OpdsControls from "./opdsControls";

interface Props extends TranslatorProps {
    publicationIdentifier: string;
    isOpds?: boolean;
    publication?: TPublicationApiGet_result;
    closeDialog?: any;
    getPublicationFromId?: () => void;
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
                <h2 className={ styles.allowUserSelect }>{ publication.title }</h2>
                <div>
                    <p className={ classNames(styles.allowUserSelect, styles.author) }>{ authors }</p>

                    {
                        (formatedPublishedDate) ?
                        (<p>
                            <span>{__("catalog.released")}
                            </span> <i className={ styles.allowUserSelect }>{ formatedPublishedDate }</i>
                        </p>) : (<></>)
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
                                className={ classNames(styles.allowUserSelect, styles.description) }
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
                            <><span>{__("catalog.publisher")}
                            </span> <i className={ styles.allowUserSelect }>{ formatedPublishers }</i> <br/></>
                        }
                        <span>{__("catalog.lang")}</span> {
                            publication.languages &&
                            publication.languages
                            .map((lang: string, index: number) => {
                                const l = lang.split("-")[0];
                                // tslint:disable-next-line:max-line-length
                                const ll = ((__(`languages.${l}` as any) as unknown) as string).replace(`languages.${l}`, lang);
                                const note = (lang !== ll) ? ` (${lang})` : "";
                                const suffix = ((index < (publication.languages.length - 1)) ? ", " : "");
                                // tslint:disable-next-line:max-line-length
                                return <i key={"lang-" + index} title={lang} className={ styles.allowUserSelect }>{ll + note + suffix}</i>;
                                // return <></>;
                            })
                        } <br/>
                        <span>{__("catalog.id")}
                        </span> <i className={ styles.allowUserSelect }>{ publication.workIdentifier }</i> <br/>
                    </p>
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
