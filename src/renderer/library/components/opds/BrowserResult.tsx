// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import * as styles from "readium-desktop/renderer/assets/styles/global.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import Loader from "readium-desktop/renderer/common/components/Loader";
import { apiState } from "readium-desktop/renderer/common/redux/api/api";
import { BROWSE_OPDS_API_REQUEST_ID } from "readium-desktop/renderer/library/redux/sagas/opds";
import { ILibraryRootState } from "readium-desktop/renderer/library/redux/states";
import { DisplayType } from "readium-desktop/renderer/library/routing";

import PublicationCard from "../publication/PublicationCard";
import { ListView } from "../utils/ListView";
import Slider from "../utils/Slider";
import Entry from "./Entry";
import EntryList from "./EntryList";
import EntryPublicationList from "./EntryPublicationList";
import MessageOpdBrowserResult from "./MessageOpdBrowserResult";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps> {
}

export class BrowserResult extends React.Component<IProps, undefined> {

    public render(): React.ReactElement<{}> {
        const { __, browserData } = this.props;
        let content = (<Loader />);

        if (!navigator.onLine) {
            content = (
                <MessageOpdBrowserResult
                    title={__("opds.network.noInternet")}
                    message={__("opds.network.noInternetMessage")}
                />
            );
        } else if (browserData?.error) { // reject in opds api // network don't reject now
            content = (
                <MessageOpdBrowserResult
                    title={__("opds.network.reject")}
                    message={browserData.errorMessage.message}
                />
            );
        } else if (browserData?.result) {
            const browserResult = browserData.result;

            if (browserResult?.data?.problemDetails) {
                const { data: { problemDetails: {
                    type,
                    title,
                    status,
                    // detail,
                    // instance,
                } } } = browserResult;

                content = (
                    <MessageOpdBrowserResult
                        title={__("opds.network.reject")}
                        message={`(http ${status}) ${title || type}`}
                    />
                );

            } else if (
                browserResult.isSuccess
                || (browserResult.isFailure && browserResult.statusCode === 401 && browserResult?.data?.opds?.auth)
            ) {

                const { data: { opds } } = browserResult;

                if (opds.navigation &&
                    !opds.publications &&
                    !opds.groups) {

                    content = (
                        <EntryList entries={opds.navigation} />
                    );
                } else if (opds.publications &&
                    !opds.navigation &&
                    !opds.groups) {

                    const facetsRender = opds.facets?.map((facet, facetId) =>
                        <section key={`facet-${facetId}`}>
                            <h3>{facet.title}</h3>
                            <EntryList entries={facet.links}></EntryList>
                        </section>,
                    );

                    content = (
                        <>
                            <div className={Array.isArray(facetsRender) ? styles.publicationgrid : ""}>
                                {
                                    Array.isArray(facetsRender)
                                        ? <div>
                                            {
                                                facetsRender
                                            }
                                        </div>
                                        : <></>
                                }
                                <div>
                                    <EntryPublicationList
                                        opdsPublicationView={opds.publications}
                                        links={opds.links}
                                        pageInfo={opds.metadata}
                                    />
                                </div>
                            </div>
                        </>
                    );
                } else if (opds.groups ||
                    opds.publications ||
                    opds.navigation) {

                    content = (
                        <>
                            {
                                opds.navigation &&
                                <EntryList entries={opds.navigation} />
                            }

                            {
                                opds.publications &&
                                <EntryPublicationList
                                    opdsPublicationView={opds.publications}
                                    links={opds.links}
                                    pageInfo={opds.metadata}
                                />
                            }

                            {
                                opds.groups?.map((group, i) =>
                                    <section key={i}>

                                        <div className={styles.heading_link}>
                                            <Entry level={this.props.level} entry={group.selfLink}></Entry>
                                            {/* <h2>{__("settings.session.title")}</h2> */}
                                        </div>
                                        {/* <h3 className={styles.entrygroups}>

                                        </h3> */}
                                        {
                                            group.navigation &&
                                            <EntryList entries={group.navigation} />
                                        }
                                        {
                                            group.publications &&
                                                (
                                                    this.props.location?.state?.displayType
                                                    || DisplayType.Grid
                                                ) === DisplayType.Grid ?
                                                <Slider
                                                    className={styles.flux_slider}
                                                    content={group.publications.map((pub, pubId) =>
                                                        <PublicationCard
                                                            key={`opds-group-${i}-${pubId}`}
                                                            publicationViewMaybeOpds={pub}
                                                            isOpds={true}
                                                        />,
                                                    )}
                                                /> :
                                                <ListView
                                                    normalOrOpdsPublicationViews={group.publications}
                                                    isOpdsView={true}
                                                />
                                        }
                                    </section>,
                                )
                            }
                        </>
                    );
                } else {
                    content = (
                        <MessageOpdBrowserResult title={__("opds.empty")} />
                    );
                }
            } else if (browserResult.isTimeout) {
                content = (
                    <MessageOpdBrowserResult title={__("opds.network.timeout")} />
                );
            } else {
                content = (
                    <MessageOpdBrowserResult
                        title={__("opds.network.error")}
                        message={`${browserResult.statusCode ? `${browserResult.statusCode} : ` : ""}${browserResult.statusMessage || ""}`}
                    />
                );
            }
        }

        return <div className={styles.opdsBrowseContent}>
            {content}
        </div>;
    }
}

const mapStateToProps = (state: ILibraryRootState, _props: IBaseProps) => {

    const apiBrowseData = apiState(state)(BROWSE_OPDS_API_REQUEST_ID)("httpbrowser/browse");
    return {
        browserData: apiBrowseData?.data,
        location: state.router.location,
        level: state.opds.browser.breadcrumb.length + 1,
    };
};

export default connect(mapStateToProps, undefined)(withTranslator(BrowserResult));
