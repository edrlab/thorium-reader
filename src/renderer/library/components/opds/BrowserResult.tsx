// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import * as styles from "readium-desktop/renderer/assets/styles/opds.css";
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

            if (browserResult.isSuccess ||
                (browserResult.isFailure && browserResult.statusCode === 401 && browserResult.data?.auth)) {

                if (browserResult.data.navigation &&
                    !browserResult.data.publications &&
                    !browserResult.data.groups) {

                    content = (
                        <EntryList entries={browserResult.data.navigation} />
                    );
                } else if (browserResult.data.publications &&
                    !browserResult.data.navigation &&
                    !browserResult.data.groups) {

                    const facetsRender = browserResult.data.facets?.map((facet, facetId) =>
                        <section key={`facet-${facetId}`}>
                            <br></br>
                            <h3>{facet.title}</h3>
                            <EntryList entries={facet.links}></EntryList>
                        </section>,
                    );

                    content = (
                        <>
                            <div className={Array.isArray(facetsRender) ? styles.publicationgrid : ""}>
                                {
                                    Array.isArray(facetsRender)
                                        ? <div className={styles.publicationgriditem}>
                                            {
                                                facetsRender
                                            }
                                        </div>
                                        : <></>
                                }
                                <div className={Array.isArray(facetsRender) ? styles.publicationgriditem : ""}>
                                    <EntryPublicationList
                                        opdsPublicationView={browserResult.data.publications}
                                        links={browserResult.data.links}
                                        pageInfo={browserResult.data.metadata}
                                    />
                                </div>
                            </div>
                        </>
                    );
                } else if (browserResult.data.groups ||
                    browserResult.data.publications ||
                    browserResult.data.navigation ||
                    browserResult.data.catalogs) {

                    content = (
                        <>
                            {
                                browserResult.data.navigation &&
                                <EntryList entries={browserResult.data.navigation} />
                            }

                            {
                                browserResult.data.catalogs &&
                                <EntryPublicationList
                                    opdsPublicationView={browserResult.data.catalogs}
                                    links={browserResult.data.links}
                                    pageInfo={browserResult.data.metadata}
                                />
                            }

                            {
                                browserResult.data.publications &&
                                <EntryPublicationList
                                    opdsPublicationView={browserResult.data.publications}
                                    links={browserResult.data.links}
                                    pageInfo={browserResult.data.metadata}
                                />
                            }

                            {
                                browserResult.data.groups?.map((group, i) =>
                                    <section key={i}>
                                        <br></br>
                                        <h3 className={styles.entrygroups}>
                                            <Entry level={this.props.level} entry={group.selfLink}></Entry>
                                        </h3>
                                        {
                                            group.navigation &&
                                            <EntryList entries={group.navigation} />
                                        }
                                        <hr></hr>
                                        {
                                            group.publications &&
                                                (
                                                    this.props.location?.state?.displayType
                                                    || DisplayType.Grid
                                                ) === DisplayType.Grid ?
                                                <Slider
                                                    className={styles.slider}
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

    const apiBrowseData = apiState(state)(BROWSE_OPDS_API_REQUEST_ID)("opds/browse");
    return {
        browserData: apiBrowseData?.data,
        location: state.router.location,
        level: state.opds.browser.breadcrumb.length + 1,
    };
};

export default connect(mapStateToProps, undefined)(withTranslator(BrowserResult));
