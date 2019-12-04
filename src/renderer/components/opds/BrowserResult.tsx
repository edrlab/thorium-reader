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
} from "readium-desktop/renderer/components/utils/hoc/translator";
import Loader from "readium-desktop/renderer/components/utils/Loader";
import { apiState } from "readium-desktop/renderer/redux/api/api";
import { BROWSE_OPDS_API_REQUEST_ID } from "readium-desktop/renderer/redux/sagas/opds";
import { RootState } from "readium-desktop/renderer/redux/states";

import OPDSAuth from "./Auth";
import EntryList from "./EntryList";
import EntryPublicationList from "./EntryPublicationList";
import MessageOpdBrowserResult from "./MessageOpdBrowserResult";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
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
        } else if (browserData?.error) {
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

                if (browserResult.data.auth) {
                    content = (
                        <OPDSAuth browserResult={browserResult}/>
                    );
                } else if (browserResult.data.navigation &&
                    !browserResult.data.publications &&
                    !browserResult.data.groups) {

                    content = (
                        <EntryList entries={browserResult.data.navigation} />
                    );
                } else if (browserResult.data.publications &&
                    !browserResult.data.navigation &&
                    !browserResult.data.groups) {

                    content = (
                            <EntryPublicationList
                                opdsPublicationView={browserResult.data.publications}
                                links={browserResult.data.links}
                                pageInfo={browserResult.data.metadata}
                            />
                        );
                } else if (browserResult.data.groups ||
                    browserResult.data.publications ||
                    browserResult.data.navigation) {

                    content = (<>
                        {browserResult.data.navigation &&
                        <EntryList entries={browserResult.data.navigation} />}

                        {browserResult.data.publications &&
                        <EntryPublicationList
                            opdsPublicationView={browserResult.data.publications}
                            links={browserResult.data.links}
                            pageInfo={browserResult.data.metadata}
                        />}

                        {browserResult.data.groups && browserResult.data.groups.map((group, i) => {
                            return (<section key={i}>
                                <br></br>
                                <h3>{group.title}</h3>
                                {group.navigation &&
                                <EntryList entries={group.navigation} />}
                                <hr></hr>
                                {group.publications &&
                                <EntryPublicationList
                                    opdsPublicationView={group.publications}
                                    links={undefined}
                                    pageInfo={undefined}
                                />}
                            </section>);
                        })}
                    </>);
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
                        message={`${browserResult.statusCode || "unknow error code"} : ${browserResult.statusMessage || ""}`}
                    />
                );
            }
        }

        return <div className={styles.opdsBrowseContent}>
            {content}
        </div>;
    }
}

const mapStateToProps = (state: RootState, _props: IBaseProps) => {

    const apiBrowseData = apiState(state)(BROWSE_OPDS_API_REQUEST_ID)("opds/browse");
    return {
        browserData: apiBrowseData?.data,
    };
};

export default connect(mapStateToProps, undefined)(withTranslator(BrowserResult));
