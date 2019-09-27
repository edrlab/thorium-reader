// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import classNames from "classnames";
import * as qs from "query-string";
import * as React from "react";
import { Helmet } from "react-helmet";
import { connect } from "react-redux";
import { RouteComponentProps, withRouter } from "react-router-dom";
import * as styles from "readium-desktop/renderer/assets/styles/settings.css";
import { RootState } from "readium-desktop/renderer/redux/states";
import LibraryHeader from "./LibraryHeader";

interface IProps extends RouteComponentProps, ReturnType<typeof mapStateToProps> {
    secondaryHeader?: React.ReactElement;
    title?: string;
    mainClassName?: string;
}

class LibraryLayout extends React.Component<IProps> {
    private fastLinkRef: any;

    public componentDidMount() {
        const { location } = this.props;
        const focusInside = qs.parse(location.search).focusInside === "true";
        if (focusInside) {
            this.fastLinkRef.focus();
        }
    }

    public render() {
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

const mapStateToProps = (state: RootState) => ({
        dialogOpen: state.dialog.open,
    });

export default connect(mapStateToProps)(withRouter(LibraryLayout));
