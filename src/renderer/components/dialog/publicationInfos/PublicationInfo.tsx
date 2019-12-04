// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import classNames from "classnames";
import * as debug_ from "debug";
import * as moment from "moment";
import * as React from "react";
import { connect } from "react-redux";
import { DialogType } from "readium-desktop/common/models/dialog";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import { IOpdsCoverView, IOpdsPublicationView } from "readium-desktop/common/views/opds";
import { CoverView, PublicationView } from "readium-desktop/common/views/publication";
import * as styles from "readium-desktop/renderer/assets/styles/bookDetailsDialog.css";
import TagManager from "readium-desktop/renderer/components/dialog/publicationInfos/TagManager";
import Cover from "readium-desktop/renderer/components/publication/Cover";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import Loader from "readium-desktop/renderer/components/utils/Loader";
import { RootState } from "readium-desktop/renderer/redux/states";
import { TDispatch } from "readium-desktop/typings/redux";

import Dialog from "../Dialog";
import CatalogControls from "./catalogControls";
import CatalogLcpControls from "./catalogLcpControls";
import LcpInfo from "./LcpInfo";
import OpdsControls from "./opdsControls";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps>, ReturnType<typeof mapDispatchToProps> {
}

interface IState {
    seeMore: boolean;
    needSeeMore: boolean;
}

// Logger
const debug = debug_("readium-desktop:renderer:publication-info");

class PublicationInfo extends React.Component<IProps, IState> {
    private descriptionWrapperRef: any;
    private descriptionRef: any;

    constructor(props: IProps) {
        super(props);

        this.state = {
            seeMore: false,
            needSeeMore: false,
        };
    }

    public componentDidMount() {
        setTimeout(this.needSeeMoreButton, 500);
    }

    public componentDidUpdate(prevProps: IProps) {

        if (this.props.publication !== prevProps.publication) {
            setTimeout(this.needSeeMoreButton, 500);
        }
    }

    public render(): React.ReactElement<{}> {

        if (!this.props.open) {
            return (<></>);
        }

        const { __, translator, publication, coverZoom } = this.props;

        const authors = () =>
            (publication.authors && publication.authors.length)
                ? publication.authors.map(
                    (author) => translator.translateContentField(author))
                    .join(", ")
                : "";

        const formatedPublishers = () =>
            publication.publishers
                && publication.publishers.length
                ? publication.publishers.join(", ")
                : undefined;

        const renderInfo = () =>
            <>
                <div className={styles.dialog_left}>
                    <div className={styles.image_wrapper}>
                        <div>
                            <Cover
                                publicationViewMaybeOpds={publication}
                                onClick={
                                    () => ((publication.cover as CoverView).coverUrl
                                        || (publication.cover as IOpdsCoverView).coverLinks[0]?.url)
                                        && this.props.toggleCoverZoom(coverZoom)}
                                onKeyPress={this.coverOnKeyPress}
                            />
                        </div>
                    </div>
                    {this.controlsComponent()}
                </div>
                <div className={styles.dialog_right}>
                    <h2 className={styles.allowUserSelect}>{publication.title}</h2>
                    <div>
                        <p className={classNames(styles.allowUserSelect, styles.author)}>{authors()}</p>
                        {this.formatedPublishedDateComponent()}
                        <div className={styles.tags}>
                            <div className={styles.tag_list}>
                                <span>{__("catalog.tags")}</span>
                                <TagManager/>
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
                            {formatedPublishers() &&
                                <><span>{__("catalog.publisher")}
                                </span> <i className={styles.allowUserSelect}>{formatedPublishers()}</i> <br /></>
                            }
                            <span>{__("catalog.lang")}</span>{this.publicationLanguageComponent()}<br />
                            <span>{__("catalog.id")}
                            </span>
                            <i className={styles.allowUserSelect}>{publication.workIdentifier}</i>
                            <br />
                        </p>

                        <LcpInfo publicationLcp={publication}></LcpInfo>

                    </div>
                </div>
            </>;

        const dialogContent = () => {
            if (publication?.title) {
                return (
                    this.props.coverZoom
                        ?
                        <Cover
                            publicationViewMaybeOpds={publication}
                            coverType="cover"
                            onClick={() => this.props.toggleCoverZoom(coverZoom)}
                            onKeyPress={() => this.coverOnKeyPress}
                        />
                        :
                        renderInfo()
                );
            }
            return (<Loader></Loader>);
        };

        return (
            <Dialog
                open={true}
                close={() =>
                    this.props.coverZoom ?
                        this.props.toggleCoverZoom(coverZoom) :
                        this.props.closeDialog()}
            >
                {dialogContent()}
            </Dialog>
        );
    }

    private controlsComponent = () => {
        const { publicationInfoLib, publicationInfoOpds, publication } = this.props;

        let controlsComponent = (<></>);

        if (publicationInfoOpds) {
            controlsComponent = (<OpdsControls opdsPublicationView={publication as IOpdsPublicationView} />);
        }
        if (publicationInfoLib) {
            if (publication?.lcp) {
                controlsComponent = (<CatalogLcpControls publicationView={publication as PublicationView} />);
            }
            controlsComponent = (<CatalogControls publicationView={publication as PublicationView} />);
        }

        return controlsComponent;
    }

    private formatedPublishedDateComponent = () => {
        const { publication, __ } = this.props;

        let formatedPublishedDateComponent = (<></>);
        if (publication.publishedAt) {
            const date = moment(publication.publishedAt).format("L");
            if (date) {
                formatedPublishedDateComponent = (
                    <p>
                        <span>{__("catalog.released")}
                        </span> <i className={styles.allowUserSelect}>{date}</i>
                    </p>
                );
            }
        }

        return formatedPublishedDateComponent;
    }

    private publicationLanguageComponent = () => {
        const { publication, __ } = this.props;

        let publicationLanguageComponent: JSX.Element | JSX.Element[] = (<></>);
        if (publication.languages) {
            publicationLanguageComponent = publication.languages
                .map((lang: string, index: number) => {
                    const l = lang.split("-")[0];

                    // because dynamic label does not pass typed i18n compilation
                    const translate = __ as (str: string) => string;

                    const ll = translate(`languages.${l}`).replace(`languages.${l}`, lang);
                    const note = (lang !== ll) ? ` (${lang})` : "";
                    const suffix = ((index < (publication.languages.length - 1)) ? ", " : "");
                    return (<i
                        key={"lang-" + index}
                        title={lang}
                        className={styles.allowUserSelect}
                    >
                        {ll + note + suffix}
                    </i>);
                });
        }

        return publicationLanguageComponent;
    }

    private coverOnKeyPress = (e: React.KeyboardEvent<HTMLImageElement>) =>
        e.key === "Enter" && this.props.toggleCoverZoom(this.props.coverZoom)

    private toggleSeeMore = () =>
        this.setState({
            seeMore: !this.state.seeMore,
        })

    private needSeeMoreButton = () => {
        if (this.descriptionWrapperRef && this.descriptionRef) {
            const need = this.descriptionWrapperRef.offsetHeight < this.descriptionRef.offsetHeight;
            this.setState({ needSeeMore: need });
        }
    }
}

const mapDispatchToProps = (dispatch: TDispatch, props: IBaseProps) => {
    // Warning : mapDispatchToProps isn't rendered when the state is updateds
    // but only when the component is mounted
    debug("mapDispatchToProps rendered");
    return {
        closeDialog: () => {
            if ((props as IProps).publicationInfoReader) {
                // TODO: this is a short-term hack.
                // Can we instead subscribe to Redux action CloseRequest,
                // but narrow it down specically to the window instance (not application-wide)
                window.document.dispatchEvent(new Event("Thorium:DialogClose"));
            }
            dispatch(
                dialogActions.closeRequest.build(),
            );
        },
        toggleCoverZoom: (state: boolean) => {
            dispatch(dialogActions.updateRequest.build(
                {
                    coverZoom: !state,
                },
            ));
        },
    };
};

const mapStateToProps = (state: RootState, _props: IBaseProps) => ({
    ...{
        open: state.dialog.type === "publication-info-opds"
            || state.dialog.type === "publication-info-reader"
            || state.dialog.type === "publication-info-lib",
        publicationInfoOpds: state.dialog.type === "publication-info-opds",
        publicationInfoReader: state.dialog.type === "publication-info-reader",
        publicationInfoLib: state.dialog.type === "publication-info-lib",
    },
    ...(state.dialog.data as DialogType["publication-info-opds"]),
    ...(state.dialog.data as DialogType["publication-info-reader"]),
});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(PublicationInfo));
