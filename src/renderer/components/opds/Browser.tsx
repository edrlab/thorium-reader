// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// import * as debug_ from "debug";
import * as React from "react";
import { connect } from "react-redux";
import * as styles from "readium-desktop/renderer/assets/styles/opds.css";
import LibraryLayout from "readium-desktop/renderer/components/layout/LibraryLayout";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import { RootState } from "readium-desktop/renderer/redux/states";

import BreadCrumb from "../layout/BreadCrumb";
import BrowserResult from "./BrowserResult";
import Header from "./Header";

// Logger
// const debug = debug_("readium-desktop:src/renderer/components/opds/browser");

interface IProps extends TranslatorProps, ReturnType<typeof mapStateToProps> {
}

class Browser extends React.Component<IProps> {
    public render(): React.ReactElement<IProps>  {
        const secondaryHeader = <Header/>;

        return (
            <LibraryLayout secondaryHeader={secondaryHeader} mainClassName={styles.opdsBrowse}>
                <BreadCrumb
                    className={styles.opdsBrowseBreadcrumb}
                    breadcrumb={this.props.breadrumb}
                    search={this.props.location.search}
                />
                {this.props.breadrumb.length &&
                    <BrowserResult/>
                }
            </LibraryLayout>
        );
    }
}

const mapStateToProps = (state: RootState) => ({
    breadrumb: state.opds.browser.breadcrumb,
    location: state.router.location,
});

export default connect(mapStateToProps, undefined)(withTranslator(Browser));
