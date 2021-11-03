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
import LibraryLayout from "readium-desktop/renderer/library/components/layout/LibraryLayout";
import { ILibraryRootState } from "readium-desktop/renderer/library/redux/states";

import BreadCrumb from "../layout/BreadCrumb";
import BrowserResult from "./BrowserResult";
import Header from "./Header";

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

class Browser extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);
    }

    public render(): React.ReactElement<IProps>  {
        const secondaryHeader = <Header/>;
        const breadCrumb = <BreadCrumb className={styles.opdsBrowseBreadcrumb} breadcrumb={this.props.breadrumb} />;

        return (
            <LibraryLayout
                title={this.props.__("header.catalogs")}
                secondaryHeader={secondaryHeader}
                breadCrumb={breadCrumb}
            >
                {this.props.breadrumb.length &&
                    <BrowserResult/>
                }
            </LibraryLayout>
        );
    }
}

const mapStateToProps = (state: ILibraryRootState) => ({
    breadrumb: state.opds.browser.breadcrumb,
    location: state.router.location,
});

export default connect(mapStateToProps, undefined)(withTranslator(Browser));
