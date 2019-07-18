// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { RouteComponentProps, withRouter } from "react-router-dom";

import AutoFocus from "readium-desktop/renderer/components/utils/AutoFocus";
import LibraryHeader from "./LibraryHeader";

import { Helmet } from "react-helmet";

import { RootState } from "readium-desktop/renderer/redux/states";

import * as qs from "query-string";

import * as styles from "readium-desktop/renderer/assets/styles/settings.css";

interface Props extends RouteComponentProps {
    dialogOpen?: boolean;
    secondaryHeader?: any;
    title?: string;
}

class LibraryLayout extends React.Component<Props> {
    public constructor(props: Props) {
        super(props);

        this.state = {
            focusInside: false,
        };
    }

    public render(): React.ReactElement<{}> {
        const { title } = this.props;

        let helmetTitle = "Thorium";
        if (title) {
            helmetTitle += " - " + title;
        }

        return (
            <div
                style={ this.props.dialogOpen ? {filter: "blur(1px)"} : {} }
            >
                <Helmet>
                    <title>{ helmetTitle }</title>
                </Helmet>
                <LibraryHeader />
                { this.props.secondaryHeader }
                <AutoFocus active={true}>
                    <main
                        className={styles.main}
                        role="main"
                    >
                        { this.props.children }
                    </main>
                </AutoFocus>
            </div>
        );
    }
}

const mapStateToProps = (state: RootState, ownProps: any) => {
    return {
        dialogOpen: state.dialog.open,
    };
};

export default connect(mapStateToProps)(withRouter(LibraryLayout));
