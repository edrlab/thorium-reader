// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import * as styles from "readium-desktop/renderer/assets/styles/opds.css";
import Loader from "readium-desktop/renderer/components/utils/Loader";
import { BROWSE_OPDS_API_REQUEST_ID } from "readium-desktop/renderer/redux/sagas/opds";

import { apiDecorator, TApiDecorator } from "../utils/decorator/api.decorator";
import { translatorDecorator } from "../utils/decorator/translator.decorator";
import { ReactComponent } from "../utils/reactComponent";
import OPDSAuth from "./Auth";
import EntryList from "./EntryList";
import EntryPublicationList from "./EntryPublicationList";
import MessageOpdBrowserResult from "./MessageOpdBrowserResult";

// tslint:disable-next-line: no-empty-interface
interface IProps {
}

@translatorDecorator
@apiDecorator("opds/browse", undefined, undefined, BROWSE_OPDS_API_REQUEST_ID)
export default class BrowserResult extends ReactComponent<
IProps
, undefined
, undefined
, undefined
, TApiDecorator<"opds/browse">
> {

    public render(): React.ReactElement<{}> {
        const { __ } = this;

        const browserData = this.api["opds/browse"].result?.data;

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
                        <OPDSAuth browserResult={browserResult} />
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
