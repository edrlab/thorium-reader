// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesColumns from "readium-desktop/renderer/assets/styles/components/columns.scss";
import * as stylesCatalogs from "readium-desktop/renderer/assets/styles/components/catalogs.scss";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.scss";

import * as React from "react";
import { VisuallyHidden } from "react-aria-components";
import { connect } from "react-redux";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import Loader from "readium-desktop/renderer/common/components/Loader";
import { apiState } from "readium-desktop/renderer/common/redux/api/api";
import { BROWSE_OPDS_API_REQUEST_ID } from "readium-desktop/renderer/library/opds/constants";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
// import { DisplayType, IRouterLocationState } from "readium-desktop/renderer/library/routing";

import PublicationCard from "../publication/PublicationCard";
// import { ListView } from "../utils/ListView";
import Slider from "../utils/Slider";
import Entry from "./Entry";
import EntryList from "./EntryList";
import EntryPublicationList from "./EntryPublicationList";
import MessageOpdBrowserResult from "./MessageOpdBrowserResult";
import { ContentType, parseContentType } from "readium-desktop/utils/contentType";

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
        let status = __("accessibility.loading");
        const message = (title: string, detail?: string) => {
            status = [title, detail].filter(Boolean).join(". ");
            return <MessageOpdBrowserResult title={title} message={detail} />;
        };
        let content = (<Loader announce={false} />);

        if (!navigator.onLine) {
            content = (
                message(__("opds.network.noInternet"), __("opds.network.noInternetMessage"))
            );
        } else if (browserData?.error) { // reject in opds api // network don't reject now
            content = (
                message(__("opds.network.reject"), browserData.errorMessage.message)
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
                    message(__("opds.network.reject"), `(http ${status}) ${title || type}`)
                );

            } else if (
                browserResult.isSuccess &&
                parseContentType(browserResult.contentType) === ContentType.Html
            ) {
                // The route saga hands Web Catalogs off to the system browser.
                content = (<Loader announce={false} />);
            } else if (
                browserResult.isSuccess
                || (browserResult.isFailure && browserResult.statusCode === 401 && browserResult?.data?.opds?.auth)
            ) {

                const { data: { opds } } = browserResult;
                const hasEntries = !!(opds.navigation?.length || opds.publications?.length
                    || opds.groups?.some(group => group.navigation?.length || group.publications?.length));
                status = hasEntries ? "" : __("opds.empty");

                if (opds.navigation &&
                    !opds.publications &&
                    !opds.groups) {

                    content = (
                        <EntryList entries={opds.navigation} variant="list" />
                    );
                } else if (opds.publications &&
                    !opds.navigation &&
                    !opds.groups) {

                    const facetsRender = opds.facets?.map((facet, facetId) =>
                        <section key={`facet-${facetId}`}>
                            <div className={stylesGlobal.heading}>
                                <h3>{facet.title}</h3>
                            </div>
                            <EntryList entries={facet.links}></EntryList>
                        </section>,
                    );

                    content = (
                        <>
                            <div className={Array.isArray(facetsRender) ? stylesColumns.row : ""}>
                                {
                                    Array.isArray(facetsRender) ?
                                        <div className={stylesColumns.col_filter}>
                                            {facetsRender}
                                        </div>
                                    :
                                        <></>
                                }
                                <div className={Array.isArray(facetsRender) ? stylesColumns.col : ""}>
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
                                opds.navigation ?
                                <EntryList entries={opds.navigation} />
                                : <></>
                            }

                            {
                                opds.publications ?
                                <EntryPublicationList
                                    opdsPublicationView={opds.publications}
                                    links={opds.links}
                                    pageInfo={opds.metadata}
                                />
                                : <></>
                            }

                            {
                                opds.groups?.map((group, i) =>
                                    <section key={i}>
                                        { group.publications?.length > 0 ?
                                        <div className={stylesGlobal.heading_link}>
                                            {group.selfLink ?
                                                <Entry level={this.props.level} entry={group.selfLink}></Entry>
                                                : <h3>{group.title}</h3>}
                                        </div>
                                        : <></>}
                                        {
                                            group.navigation ?
                                            <EntryList entries={group.navigation} />
                                            : <></>
                                        }
                                        {
                                            group.publications?.length > 0 ?
                                                    <Slider
                                                        resetSliderPosition={false}
                                                        content={group.publications.map((pub) =>
                                                            <PublicationCard
                                                                key={`opds-group-${i}-${pub.workIdentifier}`}
                                                                publicationViewMaybeOpds={pub}
                                                                isOpds={true}
                                                            />,
                                                        )}
                                                    />
                                                : <></>
                                        }
                                    </section>,
                                )
                            }
                        </>
                    );
                } else {
                    content = (
                        message(__("opds.empty"))
                    );
                }
            } else if (browserResult.isTimeout) {
                content = (
                    message(__("opds.network.timeout"))
                );
            } else {
                content = (
                    message(__("opds.network.error"), `${browserResult.statusCode ? `${browserResult.statusCode} : ` : ""}${browserResult.statusMessage || ""}`)
                );
            }
        }

        return <div className={stylesCatalogs.opds_browserResults} id="opds_browserResults">
            <VisuallyHidden><span role="status" aria-atomic="true">{status}</span></VisuallyHidden>
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
        locale: state.i18n.locale, // refresh
    };
};

export default connect(mapStateToProps, undefined)(withTranslator(BrowserResult));
