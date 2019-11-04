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

import EntryList from "./EntryList";
import EntryPublicationList from "./EntryPublicationList";
import MessageOpdBrowserResult from "./MessageOpdBrowserResult";

interface IProps extends TranslatorProps, ReturnType<typeof mapStateToProps> {
}

export class BrowserResult extends React.Component<IProps> {

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
        } else if (browserData && browserData.error) {
            content = (
                <MessageOpdBrowserResult
                    title={__("opds.network.reject")}
                    message={browserData.errorMessage.message}
                />
            );
        } else if (browserData && browserData.result) {
            const browserResult = browserData.result;

            if (browserResult.isSuccess) {
                if (browserResult.data.navigation) {
                    content = (
                        <EntryList entries={browserResult.data.navigation} />
                    );
                } else if (browserResult.data.publications) {
                    content = (
                            <EntryPublicationList
                                publications={browserResult.data.publications}
                                links={browserResult.data.links}
                                pageInfo={browserResult.data.metadata}
                            />
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

const mapStateToProps = (state: RootState) => {

    const apiBrowseData = apiState(state)(BROWSE_OPDS_API_REQUEST_ID)("opds/browse");
    return {
        browserData: apiBrowseData && apiBrowseData.data,
    };
};

export default connect(mapStateToProps)(withTranslator(BrowserResult));
