// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import * as styles from "readium-desktop/renderer/assets/styles/settings.css";

import LibraryHeader from "./LibraryHeader";

import { connect } from "react-redux";

import { Helmet } from "react-helmet";

import { RootState } from "readium-desktop/renderer/redux/states";

import * as qs from "query-string";
import { RouteComponentProps, withRouter } from "react-router-dom";

import classNames from "classnames";

interface LibraryLayoutProps extends RouteComponentProps {
    dialogOpen?: boolean;
    secondaryHeader?: any;
    title?: string;
    mainClassName?: string;
}

class LibraryLayout extends React.Component<LibraryLayoutProps, undefined> {
    private fastLinkRef: any;

    public componentDidMount() {
        const { location } = this.props;
        const focusInside = qs.parse(location.search).focusInside === "true";
        if (focusInside) {
            this.fastLinkRef.focus();
        }
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
                <main
                    id="main"
                    className={classNames(styles.main, this.props.mainClassName)}
                    role="main"
                >
                    <a ref={(ref) => this.fastLinkRef = ref} id="main-content" aria-hidden tabIndex={-1}></a>
                    { this.props.children }
                </main>
            </div>
        );
    }
}

const mapStateToProps = (state: RootState, _ownProps: any) => {
    return {
        dialogOpen: state.dialog.open,
    };
};

export default connect(mapStateToProps)(withRouter(LibraryLayout));
