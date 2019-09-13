// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import classNames from "classnames";
import * as moment from "moment";
import * as React from "react";
import { connect } from "react-redux";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import { TPublicationApiGet_result } from "readium-desktop/main/api/publication";
import { apiFetch } from "readium-desktop/renderer/apiFetch";
import { apiRefresh } from "readium-desktop/renderer/apiRefresh";
import * as styles from "readium-desktop/renderer/assets/styles/bookDetailsDialog.css";
import Cover from "readium-desktop/renderer/components/publication/Cover";
import TagManager from "readium-desktop/renderer/components/publication/TagManager";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import { RootState } from "readium-desktop/renderer/redux/states";
import { TDispatch } from "readium-desktop/typings/redux";
import { Unsubscribe } from "redux";
import { oc } from "ts-optchain";

import CatalogControls from "./catalogControls";
import CatalogLcpControls from "./catalogLcpControls";
import OpdsControls from "./opdsControls";

interface IProps extends TranslatorProps, ReturnType<typeof mapDispatchToProps>, ReturnType<typeof mapStateToProps> {
    publicationIdentifier: string;
    isOpds?: boolean;
    hideControls?: boolean;
}

interface IState {
    seeMore: boolean;
    needSeeMore: boolean;
    publication: TPublicationApiGet_result | undefined;
}

class PublicationInfo extends React.Component<IProps, IState> {
    private descriptionWrapperRef: any;
    private descriptionRef: any;
    private unsubscribe: Unsubscribe;

    public constructor(props: IProps) {
        super(props);

        this.state = {
            seeMore: false,
            needSeeMore: false,
            publication: undefined,
        };
        this.toggleSeeMore = this.toggleSeeMore.bind(this);
        this.getPublicationFromId = this.getPublicationFromId.bind(this);
    }

    public componentDidMount() {
        if (this.props.publicationIdentifier) {
            this.unsubscribe = apiRefresh([
                "publication/updateTags",
            ], this.getPublicationFromId);
        }

        setTimeout(this.needSeeMoreButton.bind(this), 1);
    }

    public componentDidUpdate(_oldProps: IProps) {
        this.needSeeMoreButton();

    }

    public componentWillUnmount() {
        this.unsubscribe();
    }

    public render(): React.ReactElement<{}> {
        const { __, translator } = this.props;
        const { publication } = this.state;

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
                <div className={styles.dialog_left}>
                    <div className={styles.image_wrapper}>
                        <div>
                            <Cover publication={publication} />
                        </div>
                    </div>
                    {!this.props.hideControls &&
                        <Controls publication={publication} />
                    }
                </div>
                <div className={styles.dialog_right}>
                    <h2 className={styles.allowUserSelect}>{publication.title}</h2>
                    <div>
                        <p className={classNames(styles.allowUserSelect, styles.author)}>{authors}</p>

                        {
                            (formatedPublishedDate) ?
                                (<p>
                                    <span>{__("catalog.released")}
                                    </span> <i className={styles.allowUserSelect}>{formatedPublishedDate}</i>
                                </p>) : (<></>)
                        }
                        <div className={styles.tags}>
                            <div className={styles.tag_list}>
                                <span>Tags</span>
                                <TagManager
                                    publicationIdentifier={publication.identifier}
                                    tags={publication.tags}
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
                                    className={classNames(styles.allowUserSelect, styles.description)}
                                >
                                    {publication.description}
                                </p>
                            </div>
                            {this.state.needSeeMore &&
                                <button aria-hidden className={styles.seeMoreButton} onClick={this.toggleSeeMore}>
                                    {this.state.seeMore ? __("publication.seeLess") : __("publication.seeMore")}
                                </button>
                            }
                        </>}

                        <h3>{__("catalog.moreInfo")}</h3>

                        <p>
                            {formatedPublishers &&
                                <><span>{__("catalog.publisher")}
                                </span> <i className={styles.allowUserSelect}>{formatedPublishers}</i> <br /></>
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
                                        return <i key={"lang-" + index} title={lang} className={styles.allowUserSelect}>{ll + note + suffix}</i>;
                                        // return <></>;
                                    })
                            } <br />
                            <span>{__("catalog.id")}
                            </span> <i className={styles.allowUserSelect}>{publication.workIdentifier}</i> <br />
                        </p>
                    </div>
                </div>
            </>
        );
    }

    private toggleSeeMore() {
        this.setState({ seeMore: !this.state.seeMore });
    }

    private needSeeMoreButton() {
        if (!this.descriptionWrapperRef || !this.descriptionRef) {
            return;
        }
        const need = this.descriptionWrapperRef.offsetHeight < this.descriptionRef.offsetHeight;
        this.setState({ needSeeMore: need });
    }

    private getPublicationFromId() {
        apiFetch("publication/get", this.props.publicationIdentifier || this.state.publication.identifier)
            .then((publication) => this.setState({ publication }))
            .catch((error) => {
                console.error(`Error to fetch publication/get`, error);
            });
    }
}

const mapDispatchToProps = (dispatch: TDispatch) => {
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

// no needed withTranslator is was already included in withApi
export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(PublicationInfo));
    /*withApi(
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
},
)));*/
